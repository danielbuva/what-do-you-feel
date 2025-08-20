import {
	BreathingMaterial,
	type BreathingMaterialUniforms,
} from '@/lib/three/BreathingMaterial'
import { extend, useFrame } from '@react-three/fiber'
import { type RefObject, useLayoutEffect, useRef } from 'react'
import {
	Color,
	type InstancedMesh,
	MathUtils,
	Object3D,
	SphereGeometry,
	Vector3,
} from 'three'
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
const dummy = new Object3D()
const sphereGeo = new SphereGeometry(0.06, 6, 6)

const getColorAt = (i: number) => {
	return color.fromArray(colors, i * 3)
}

export default function SphereOfColors({
	isDragging,
}: { isDragging: RefObject<boolean> }) {
	const meshRef = useRef<InstancedMesh | null>(null)
	useLayoutEffect(() => {
		if (!meshRef.current) return
		for (let i = 0; i < positions.length; i++) {
			dummy.position.copy(positions[i])
			dummy.updateMatrix()
			meshRef.current.setMatrixAt(i, dummy.matrix)
		}
		meshRef.current.instanceMatrix.needsUpdate = true
	}, [])

	const shaderRef = useRef<BreathingMaterialUniforms>(null)
	useFrame(({ clock }) => {
		// update shader uniforms every frame
		if (!shaderRef.current) return
		shaderRef.current.uniforms.uTime.value = clock.getElapsedTime()
	})

	return (
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

				if (id >= 0) {
					const color = getColorAt(id)
					console.log('picked color', color.getStyle())
				}
			}}
		>
			<instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
			<breathingMaterial ref={shaderRef} attach="material" />
		</instancedMesh>
	)
}
