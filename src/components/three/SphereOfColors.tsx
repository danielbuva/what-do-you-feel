import {
	BreathingMaterial,
	type BreathingMaterialUniforms,
} from '@/lib/three/BreathingMaterial'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { extend, useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { type RefObject, useLayoutEffect, useMemo, useRef } from 'react'
import {
	Color,
	type InstancedMesh,
	MathUtils,
	Matrix4,
	Object3D,
	SphereGeometry,
	Vector3,
} from 'three'
import ButtonTest from './ButtonTest'
extend({ BreathingMaterial })

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
	const meshRef = useRef<InstancedMesh | null>(null)

	// const [focusLight, setFocusLight] = useState<JSX.Element | null>()
	// const focusRef = useRef<Mesh>(null)

	useLayoutEffect(() => {
		if (!meshRef.current) return
		for (let i = 0; i < positions.length; i++) {
			dummy.position.copy(positions[i])
			dummy.updateMatrix()
			meshRef.current.setMatrixAt(i, dummy.matrix)
		}
		meshRef.current.instanceMatrix.needsUpdate = true
	}, [dummy])

	const shaderRef = useRef<BreathingMaterialUniforms>(null)
	useFrame(({ clock }) => {
		// update shader uniforms every frame
		if (!shaderRef.current) return
		shaderRef.current.uniforms.uTime.value = clock.getElapsedTime()
	})

	const { camera } = useThree()
	const worldMat = new Matrix4()
	const handleClick = (id: number) => {
		if (id < 0) return
		const mesh = meshRef.current
		if (!mesh) return
		// make sure the mesh world matrix is current
		mesh.updateMatrixWorld(true)

		// read the instance matrix (local space)
		mesh.getMatrixAt(id, dummy.matrix)

		// compute worldMatrix = mesh.matrixWorld * instanceMatrix
		worldMat.multiplyMatrices(mesh.matrixWorld, dummy.matrix)

		// decompose worldMatrix into position/quaternion/scale on dummy
		worldMat.decompose(dummy.position, dummy.quaternion, dummy.scale)

		const target = dummy.position.clone()

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

	// Get color
	// const pickedColor = getColorAt(id)

	// Create a focus mesh
	// const focusMesh = (
	// 	<mesh
	// 		ref={focusRef}
	// 		position={[dummy.position.x, dummy.position.y, dummy.position.z]}
	// 		geometry={new SphereGeometry(0.06, 16, 16)}
	// 	>
	// 		<meshStandardMaterial color={pickedColor} />
	// 	</mesh>
	// )
	// setFocusLight(focusMesh)
	// console.log({
	// 	col: pickedColor,
	// 	act: focusMesh.props.children.props.color,
	// 	sameCol:
	// 		pickedColor.r === focusMesh.props.children.props.color.r &&
	// 		pickedColor.g === focusMesh.props.children.props.color.g &&
	// 		pickedColor.b === focusMesh.props.children.props.color.b,
	// })

	return (
		<>
			<instancedMesh
				ref={meshRef}
				args={[sphereGeo, undefined, COUNT]}
				rotation={[-0.7, -2.5, 2]}
				onPointerEnter={(e) => {
					e.stopPropagation()
					const id = typeof e.instanceId === 'number' ? e.instanceId : -1
					if (!shaderRef.current) return
					shaderRef.current.uniforms.uHovered.value = id
					if (isDragging.current) return
					document.body.style.cursor = 'pointer'
				}}
				onPointerMove={(e) => {
					e.stopPropagation()
					const id = typeof e.instanceId === 'number' ? e.instanceId : -1
					if (!shaderRef.current) return
					shaderRef.current.uniforms.uHovered.value = id
					if (isDragging.current) return
					document.body.style.cursor = 'pointer'
				}}
				onPointerOut={(e) => {
					if (isDragging.current) return
					e.stopPropagation()
					document.body.style.cursor = 'auto'
					if (!shaderRef.current) return
					shaderRef.current.uniforms.uHovered.value = -1
				}}
				onClick={(e) => {
					if (isDragging.current) return
					e.stopPropagation()
					document.body.style.cursor = 'pointer'
					const id = typeof e.instanceId === 'number' ? e.instanceId : -1
					if (shaderRef.current) {
						shaderRef.current.uniforms.uSelected.value = id
					}
					// if (id >= 0) {
					// 	const color = getColorAt(id)
					// 	console.log('picked color', color.getStyle())
					// }
				}}
			>
				<instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
				<breathingMaterial ref={shaderRef} attach="material" />
			</instancedMesh>
			{/* {focusLight} */}
			<ButtonTest
				onClick={() =>
					handleClick(shaderRef.current?.uniforms.uSelected.value ?? -1)
				}
			/>
		</>
	)
}
