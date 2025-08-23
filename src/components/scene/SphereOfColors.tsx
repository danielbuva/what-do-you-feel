import {
	BreathingMaterial,
	type BreathingMaterialUniforms,
} from '@/lib/three/BreathingMaterial'
import type { TrackballControls as TrackballControlsImpl } from 'three-stdlib'

import { uiTunnel } from '@/lib/utils'

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
import SceneOptions from './ui/SceneOptions'
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

const getColorAt = (i: number) => {
	return color.fromArray(colors, i * 3)
}

export default function SphereOfColors({
	isDragging,
	trackballControlsRef,
}: {
	isDragging: RefObject<boolean>
	trackballControlsRef: RefObject<TrackballControlsImpl | null>
}) {
	const dummy = useMemo(() => new Object3D(), [])
	const instancedMeshRef = useRef<InstancedMesh | null>(null)

	const [orbPosition, setOrbPosition] = useState<Vector3>(new Vector3())
	const [orbColor, setOrbColor] = useState<Color | null>(null)
	const orbRef = useRef<Mesh>(null)
	const orbMatRef = useRef<OrbMaterialUniforms>(null)
	const optionsRef = useRef<HTMLDivElement>(null)

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
	// const z = 0
	useFrame((_, delta) => {
		// update shader uniforms every frame
		if (orbMatRef.current) {
			orbMatRef.current.uniforms.uTime.value += delta
		}
		// if (orbRef.current && ready.current) {
		// 	// Convert pointer to world space
		// 	const vector = new Vector3(pointer.x, pointer.y, 0.5)
		// 	vector.unproject(camera)

		// 	// Project to desired Z plane
		// 	const dir = vector.sub(camera.position).normalize()
		// 	const distanceToPlane = (z - camera.position.z) / dir.z
		// 	const pos = camera.position
		// 		.clone()
		// 		.add(dir.multiplyScalar(distanceToPlane))

		// 	// Smoothly follow
		// 	orbRef.current.position.lerp(pos, 0.2)

		// 	// Scale based on distance
		// 	const distance = orbRef.current.position.distanceTo(camera.position)
		// 	const scaleFactor = Math.min(distance, 1) // clamp between 0.2 and 1
		// 	orbRef.current.scale.setScalar(scaleFactor)
		// }

		if (!instancedMatRef.current) return
		instancedMatRef.current.uniforms.uTime.value += delta
	})

	const { camera } = useThree()
	const worldMat = useMemo(() => new Matrix4(), [])
	const handleClick = (id: number) => {
		if (id < 0) return
		if (!instancedMeshRef.current) return
		if (!trackballControlsRef.current) return
		if (!instancedMatRef.current) return
		if (!orbMatRef.current) return

		const mesh = instancedMeshRef.current
		// make sure the mesh world matrix is current
		mesh.updateMatrixWorld(true)

		// read the instance matrix (local space)
		mesh.getMatrixAt(id, dummy.matrix)

		// compute worldMatrix = mesh.matrixWorld * instanceMatrix
		worldMat.multiplyMatrices(mesh.matrixWorld, dummy.matrix)

		// decompose worldMatrix into position/quaternion/scale on dummy
		worldMat.decompose(dummy.position, dummy.quaternion, dummy.scale)

		const target = dummy.position.clone()
		setOrbPosition(target)
		setOrbColor(getColorAt(id))

		// compute a camera position offset along the current camera->target direction
		// keep same direction as existing camera relative to target
		const camDir = camera.position.clone().sub(target).normalize()
		const newCamPos = target.clone().add(camDir.multiplyScalar(0.5)) // distance

		// optionally disable controls during animation
		const controls = trackballControlsRef.current
		controls.enabled = false

		// animate camera position and make it look at target each frame
		gsap.killTweensOf(camera.position)
		gsap
			.timeline()
			.to(camera.position, {
				x: newCamPos.x,
				y: newCamPos.y,
				z: newCamPos.z,
				duration: 1.0,
				ease: 'power2.inOut',
				onUpdate: () => camera.lookAt(target.x, target.y, target.z),
				onComplete: () => {
					// re-enable controls after small delay so it feels smooth
					controls.target.set(target.x, target.y, target.z)
					controls.update()
					controls.enabled = true
				},
			}) // hide instances
			.to(instancedMatRef.current.uniforms.uOpacity, {
				value: 0,
				duration: 1.0,
				ease: 'power2.inOut',
			}) // take it away using scale
			.to(mesh.scale, {
				x: 0,
				y: 0,
				z: 0,
				duration: 1.0,
				ease: 'power2.inOut',
			})
		// show replacement mesh
		gsap.to(orbMatRef.current.uniforms.uOpacity, {
			value: 1.0,
			duration: 1.0,
			delay: 1.0,
			ease: 'power2.inOut',
		})
		// show options
		gsap.to(optionsRef.current, {
			opacity: 1.0,
			duration: 1.0,
			delay: 1.0,
			ease: 'power2.inOut',
		})
		// animate controls.target if you have OrbitControls
		gsap.killTweensOf(controls.target)
		gsap.to(controls.target, {
			x: target.x,
			y: target.y,
			z: target.z,
			duration: 1.0,
			ease: 'power2.inOut',
			onUpdate: () => controls.update(),
		})
	}

	// animate camera back to origin
	// hide noise options
	// set controls to target origin/ instanced mesh
	// return scale of instances
	const handleBack = () => {
		// if (id < 0) return
		if (!instancedMeshRef.current) return
		if (!trackballControlsRef.current) return
		if (!instancedMatRef.current) return
		if (!orbMatRef.current) return
		const instances = instancedMeshRef.current
		// optionally disable controls during animation
		const controls = trackballControlsRef.current
		// controls.enabled = false

		// order of anims: scale ->
		// hide orb + show instances + zoom out +
		// everything looks at origin/ instances
		instances.scale.set(1, 1, 1)

		gsap.killTweensOf(camera.position)
		gsap
			.timeline()
			.to(instancedMatRef.current.uniforms.uOpacity, {
				value: 1,
				duration: 1.0,
				ease: 'power2.inOut',
			})
			.to(camera.position, {
				x: 4,
				y: 4,
				z: 4,
				duration: 1.0,
				ease: 'power2.inOut',
				onUpdate: () =>
					camera.lookAt(
						instances.position.x,
						instances.position.y,
						instances.position.z
					),
			})

		// hide orb
		gsap.to(orbMatRef.current.uniforms.uOpacity, {
			value: 0,
			duration: 1.0,
			ease: 'power2.inOut',
		})
		// hide options
		gsap.to(optionsRef.current, {
			opacity: 0,
			duration: 1.0,
			ease: 'power2.inOut',
		})
		// animate controls.target if you have OrbitControls
		gsap.killTweensOf(controls.target)
		gsap.to(controls.target, {
			x: instances.position.x,
			y: instances.position.y,
			z: instances.position.z,
			duration: 1.0,
			ease: 'power2.inOut',
			onUpdate: () => controls.update(),
		})
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
					transparent
				/>
			</instancedMesh>
			<mesh
				ref={orbRef}
				position={orbPosition}
				geometry={new SphereGeometry(0.06, 64)}
			>
				<orbMaterial
					ref={orbMatRef}
					uOpacity={0}
					transparent
					uColor={orbColor ?? new Color()}
					depthTest={false}
				/>
			</mesh>
			<uiTunnel.In>
				<SceneOptions
					scene={[
						{
							confirm: () =>
								handleClick(
									instancedMatRef.current?.uniforms.uSelected.value ?? -1
								),
							back: handleBack,
						},
					]}
					orbMatRef={orbMatRef}
					optionsRef={optionsRef}
				/>
			</uiTunnel.In>
		</>
	)
}
