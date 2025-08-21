import {
	BreathingMaterial,
	type BreathingMaterialUniforms,
} from '@/lib/three/BreathingMaterial'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { OrbMaterial, type OrbMaterialUniforms } from '@/lib/three/Orb'
import { extend, useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import {
	type RefObject,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import {
	Color,
	type InstancedMesh,
	MathUtils,
	Matrix4,
	type Mesh,
	Object3D,
	SphereGeometry,
	Vector3,
} from 'three'
import ButtonTest from './ButtonTest'
extend({ BreathingMaterial, OrbMaterial })

const goldenAngle = Math.PI * (1 + Math.sqrt(5))
const twoPI = 2 * Math.PI

const COUNT = 2500
const RADIUS = 3

const positions: Vector3[] = []
const colors = new Float32Array(COUNT * 3)
const color = new Color()
for (let i = 0; i < COUNT; i++) {
	const phi = Math.acos(1 - (2 * (i + 0.5)) / COUNT)
	const theta = goldenAngle * i
	const x = RADIUS * Math.cos(theta) * Math.sin(phi)
	const y = RADIUS * Math.sin(theta) * Math.sin(phi)
	const z = RADIUS * Math.cos(phi)
	positions.push(new Vector3(x, y, z))

	const h = theta / twoPI
	const l = MathUtils.lerp(0.69, 0.169, i / 1.69 / COUNT)
	color.setHSL(h, 0.9, l)

	const threeI = i * 3
	colors[threeI] = color.r
	colors[threeI + 1] = color.g
	colors[threeI + 2] = color.b
}
// to fix hot reload move dummy into component
// const dummy = new Object3D()
const sphereGeo = new SphereGeometry(0.06, 6, 6)

// const getColorAt = (i: number) => {
// 	return color.fromArray(colors, i * 3)
// }

export default function SphereOfColors({
	isDragging,
	orbitControlsRef,
}: {
	isDragging: RefObject<boolean>
	orbitControlsRef: RefObject<OrbitControlsImpl | null>
}) {
	const dummy = useMemo(() => new Object3D(), [])
	const instancedMeshRef = useRef<InstancedMesh | null>(null)

	const [orbPosition, setOrbPosition] = useState<
		Vector3 | [x: number, y: number, z: number]
	>([0, 0, 0])
	const singleOrbRef = useRef<Mesh>(null)
	const singleOrbMatRef = useRef<OrbMaterialUniforms>(null)

	useLayoutEffect(() => {
		if (!instancedMeshRef.current) return
		for (let i = 0; i < positions.length; i++) {
			dummy.position.copy(positions[i])
			dummy.updateMatrix()
			instancedMeshRef.current.setMatrixAt(i, dummy.matrix)
		}
		instancedMeshRef.current.instanceMatrix.needsUpdate = true
	}, [dummy])

	const instancedMatRef = useRef<BreathingMaterialUniforms>(null)
	useFrame(({ clock }) => {
		// update shader uniforms every frame
		if (!instancedMatRef.current) return
		instancedMatRef.current.uniforms.uTime.value = clock.getElapsedTime()
	})

	const { camera } = useThree()
	const worldMat = useMemo(() => new Matrix4(), [])
	const handleClick = (id: number) => {
		if (id < 0) return
		const mesh = instancedMeshRef.current
		if (!mesh) return
		// make sure the mesh world matrix is current
		mesh.updateMatrixWorld(true)

		// read the instance matrix (local space)
		mesh.getMatrixAt(id, dummy.matrix)

		// compute worldMatrix = mesh.matrixWorld * instanceMatrix
		worldMat.multiplyMatrices(mesh.matrixWorld, dummy.matrix)

		// decompose worldMatrix into position/quaternion/scale on dummy
		worldMat.decompose(dummy.position, dummy.quaternion, dummy.scale)

		// const color = getColorAt(id)
		const target = dummy.position.clone()
		setOrbPosition(target)

		// compute a camera position offset along the current camera->target direction
		// keep same direction as existing camera relative to target
		const camDir = camera.position.clone().sub(target).normalize()
		const newCamPos = target.clone().add(camDir.multiplyScalar(0.5)) // distance

		// optionally disable controls during animation
		if (orbitControlsRef?.current) orbitControlsRef.current.enabled = false

		// animate camera position and make it look at target each frame
		gsap.killTweensOf(camera.position)
		gsap.to(camera.position, {
			x: newCamPos.x,
			y: newCamPos.y,
			z: newCamPos.z,
			duration: 1.0,
			ease: 'power2.inOut',
			onUpdate: () => camera.lookAt(target.x, target.y, target.z),
			onComplete: () => {
				// re-enable controls after small delay so it feels smooth
				if (orbitControlsRef?.current) {
					orbitControlsRef.current.target.set(target.x, target.y, target.z)
					orbitControlsRef.current.update()
					orbitControlsRef.current.enabled = true
				}
			},
		})
		if (instancedMatRef.current && instancedMeshRef.current) {
			gsap
				.timeline()
				.to(instancedMatRef.current.uniforms.uOpacity, {
					value: 0,
					duration: 1.0,
					delay: 1.0,
					ease: 'power2.inOut',
				})
				.to(instancedMeshRef.current.scale, {
					x: 0,
					y: 0,
					z: 0,
					duration: 1.0,
					ease: 'power2.inOut',
				})
		}
		if (singleOrbMatRef.current) {
			gsap.to(singleOrbMatRef.current.uniforms.uOpacity, {
				value: 1,
				duration: 1.0,
				delay: 1.0,
				ease: 'power2.inOut',
			})
		}

		// animate controls.target if you have OrbitControls
		if (orbitControlsRef.current) {
			const controls = orbitControlsRef.current
			gsap.killTweensOf(orbitControlsRef.current.target)
			gsap.to(orbitControlsRef.current.target, {
				x: target.x,
				y: target.y,
				z: target.z,
				duration: 1.0,
				ease: 'power2.inOut',
				onUpdate: () => controls.update(),
			})
		}
	}

	return (
		<>
			<instancedMesh
				ref={instancedMeshRef}
				args={[sphereGeo, undefined, COUNT]}
				rotation={[-0.7, -2.5, 2]}
				onPointerEnter={(e) => {
					e.stopPropagation()
					const id = typeof e.instanceId === 'number' ? e.instanceId : -1
					if (!instancedMatRef.current) return
					instancedMatRef.current.uniforms.uHovered.value = id
					if (isDragging.current) return
					document.body.style.cursor = 'pointer'
				}}
				onPointerMove={(e) => {
					e.stopPropagation()
					const id = typeof e.instanceId === 'number' ? e.instanceId : -1
					if (!instancedMatRef.current) return
					instancedMatRef.current.uniforms.uHovered.value = id
					if (isDragging.current) return
					document.body.style.cursor = 'pointer'
				}}
				onPointerOut={(e) => {
					if (isDragging.current) return
					e.stopPropagation()
					document.body.style.cursor = 'auto'
					if (!instancedMatRef.current) return
					instancedMatRef.current.uniforms.uHovered.value = -1
				}}
				onClick={(e) => {
					if (isDragging.current) return
					e.stopPropagation()
					document.body.style.cursor = 'pointer'
					const id = typeof e.instanceId === 'number' ? e.instanceId : -1
					if (instancedMatRef.current) {
						instancedMatRef.current.uniforms.uSelected.value = id
					}
				}}
			>
				<instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
				<breathingMaterial
					ref={instancedMatRef}
					attach="material"
					uOpacity={1.0}
					depthWrite={false}
					transparent
				/>
			</instancedMesh>
			<mesh
				ref={singleOrbRef}
				position={orbPosition}
				geometry={new SphereGeometry(0.06, 16, 16)}
			>
				<orbMaterial ref={singleOrbMatRef} uOpacity={0.1} transparent />
			</mesh>
			<ButtonTest
				onClick={() =>
					handleClick(instancedMatRef.current?.uniforms.uSelected.value ?? -1)
				}
			/>
		</>
	)
}
