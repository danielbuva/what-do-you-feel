import { shaderMaterial } from '@react-three/drei'
// SphereOfLights.tsx
import { type ThreeElement, extend, useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
	Color,
	InstancedBufferAttribute,
	type InstancedMesh,
	MathUtils,
	Object3D,
	type ShaderMaterial,
	SphereGeometry,
	Vector3,
} from 'three'

const goldenAngle = Math.PI * (1 + Math.sqrt(5))
const twoPI = 2 * Math.PI

const BreathingMaterial = shaderMaterial(
	{
		uTime: 0,
		uHovered: -1, // instance ID being hovered
		uSelected: -1, // instance ID selected
	},
	// vertex shader
	/*glsl*/ `
		uniform float uTime;
		varying vec3 vColor;
		varying vec3 vNormal;
		varying float vInstanceID;

		void main() {
		  vec3 transformed = position;
			
			float phase = float(gl_InstanceID) * 0.1;

			float s = sin(uTime + phase);
			float c = cos(s + phase);

			float move = s * 0.01;
			vec3 wobble = vec3(s, c, 0.0) * 0.01;

			transformed += normal * move + wobble;


		  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
			
		  vColor = instanceColor;
			vInstanceID = float(gl_InstanceID);
			vNormal = normalize(normalMatrix * normal);
		}
  `,
	// fragment shader
	/*glsl*/ `
    uniform int uHovered;
    uniform int uSelected;
    varying vec3 vColor;
    varying float vInstanceID;
		varying vec3 vNormal;

    void main() {
      // simple cell shading
  		vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  		float brightness = dot(vNormal, lightDir);
  		brightness = floor(brightness * 3.0) / 3.0; // 3 levels
  		vec3 shadedColor = vColor * brightness;

      // add hover & selection highlights
			vec3 highlight = vec3(0.0);
			if (int(vInstanceID) == uHovered) highlight = vec3(0.3);
			if (int(vInstanceID) == uSelected) highlight = vec3(0.8);
			vec3 finalColor = clamp(shadedColor + highlight, 0.0, 1.0);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
)

extend({ BreathingMaterial })

declare module '@react-three/fiber' {
	interface ThreeElements {
		breathingMaterial: ThreeElement<
			typeof BreathingMaterial & {
				uTime: number
				uHovered: number
				uSelected: number
			}
		>
	}
}

interface BreathingMaterialUniforms extends ShaderMaterial {
	uniforms: {
		uTime: { value: number }
		uHover: { value: number }
		uSelected: { value: number }
	}
}

export default function SphereOfColors({ count = 2500, radius = 3 }) {
	const [hoveredId, setHoveredId] = useState<number>(-1)
	const [selectedId, setSelectedId] = useState<number>(-1)
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const meshRef = useRef<InstancedMesh>(null!)
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const matRef = useRef<BreathingMaterialUniforms>(null!)

	// Store dummy object for positioning instances
	const dummy = useMemo(() => new Object3D(), [])

	// Precompute positions/colors
	const { positions, colors } = useMemo(() => {
		const positions: Vector3[] = []
		const colors: Color[] = []
		for (let i = 0; i < count; i++) {
			const phi = Math.acos(1 - (2 * (i + 0.5)) / count)
			const theta = goldenAngle * i
			const x = radius * Math.cos(theta) * Math.sin(phi)
			const y = radius * Math.sin(theta) * Math.sin(phi)
			const z = radius * Math.cos(phi)

			positions.push(new Vector3(x, y, z))

			const h = theta / twoPI
			const l = MathUtils.lerp(0, 0.8, i / 1.69 / count)
			const color = new Color().setHSL(h, 0.9, l)

			// enhance the strongest channel slightly
			const rgb = [color.r, color.g, color.b]
			const col = rgb.indexOf(Math.max(color.r, color.g, color.b))
			rgb[col] = Math.min(1, rgb[col] * 69) // boost the dominant channel

			color.setRGB(rgb[0], rgb[1], rgb[2])

			colors.push(color)
		}

		return { positions, colors }
	}, [count, radius])

	// Apply matrices & colors once mesh is mounted
	useLayoutEffect(() => {
		if (!meshRef.current) return
		positions.forEach((pos, i) => {
			dummy.position.copy(pos)
			dummy.updateMatrix()
			meshRef.current?.setMatrixAt(i, dummy.matrix)
			meshRef.current?.setColorAt(i, colors[i])
		})
		meshRef.current.instanceMatrix.needsUpdate = true
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		meshRef.current.instanceColor!.needsUpdate = true
	}, [positions, colors, dummy])

	useFrame(({ clock }) => {
		if (matRef.current)
			matRef.current.uniforms.uTime.value = clock.getElapsedTime()
	})

	return (
		<instancedMesh
			rotation={[-0.8, 0.6, 0.05]}
			ref={meshRef}
			args={[new SphereGeometry(0.05, 8, 8), undefined, count]}
			onPointerDown={(e) => {
				setSelectedId(e.instanceId ?? -1)
			}}
			onPointerOut={() => setHoveredId(-1)}
			instanceColor={
				new InstancedBufferAttribute(
					new Float32Array(colors.flatMap((c) => [c.r, c.g, c.b])),
					3
				)
			}
		>
			<breathingMaterial
				ref={matRef}
				attach="material"
				uHovered={hoveredId ?? -1}
				uSelected={selectedId ?? -1}
			/>
		</instancedMesh>
	)
}
