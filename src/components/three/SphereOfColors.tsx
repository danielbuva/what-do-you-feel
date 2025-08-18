// SphereOfColors.tsx (fixed)
import { shaderMaterial } from '@react-three/drei'
import { type ThreeElement, extend } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
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
	Object3D,
	type ShaderMaterial,
	SphereGeometry,
	Vector3,
} from 'three'

const goldenAngle = Math.PI * (1 + Math.sqrt(5))
const twoPI = 2 * Math.PI

/* BreathingMaterial defined elsewhere (your working shader) */
const BreathingMaterial = shaderMaterial(
	{ uTime: 0, uHovered: -1, uSelected: -1 },
	/* vertex */ `
    uniform float uTime;
    varying vec3 vColor;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying float vInstanceID;
    void main() {
      vec3 transformed = position;
      float phase = float(gl_InstanceID) * 0.1;
      float s = sin(uTime + phase);
      float c = cos(s + phase);
      float move = s * 0.01;
      vec3 wobble = vec3(s, c, 0.0) * 0.01;
      transformed += normal * move + wobble;

      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vColor = instanceColor;                     // instanceColor will be provided by the attribute
      vNormal = normalize(normalMatrix * normal);
      vViewDir = normalize(-mvPosition.xyz);
      vInstanceID = float(gl_InstanceID);
    }
  `,
	/* fragment */ `
uniform int uHovered;
uniform int uSelected;
varying vec3 vColor;
varying float vInstanceID;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // ----- edge metric (0 in front-facing areas, >0 near silhouettes) -----
  float edge = 1.0 - dot(normalize(vNormal), normalize(vViewDir));
  // edgeThreshold & edgeSoftness control how narrow the edge band is
  float edgeThreshold = 0.18;   // move this to adjust where the outline begins
  float edgeSoftness = 0.03;    // smaller = crisper / thinner outline
  float edgeMask = smoothstep(edgeThreshold, edgeThreshold + edgeSoftness, edge);

  // ----- base color (no heavy shading in the center) -----
  vec3 baseColor = vColor;

  // ----- quantized cell shading (applied only at edges) -----
  // compute simple lighting value (view-based lambert-like)
  float lightDot = dot(normalize(vNormal), normalize(vViewDir)); // 1.0 = facing camera
  // invert so edges are darker: (you can also use other light direction)
  float facing = clamp(lightDot, 0.0, 1.0);

  // quantize into discrete levels (hardness of cell shading)
  float levels = 2.0; // try 2 or 3 for stronger banding (lower = fewer levels)
  float quant = floor(facing * levels) / levels;

  // mix quantized shading *only* at edgeMask (so interior keeps baseColor)
  float edgeShadeMix = 1.0; // 1.0 means full quantized effect at edges
  vec3 edgeShadedColor = mix(baseColor, baseColor * quant, edgeMask * edgeShadeMix);

  // ----- outline for hover/selected (thin and edge-only) -----
  // robust float equality: produce 1.0 if ID matches (abs < 0.5)
  float isSelected = 1.0 - step(0.5, abs(vInstanceID - float(uSelected)));
  float isHovered  = 1.0 - step(0.5, abs(vInstanceID - float(uHovered)));

  // outline strengths
  float hoverOutlineStrength = 0.35;   // subtle
  float selectedOutlineStrength = 0.7; // stronger

  // Use edgeMask to localize outline to silhouette region, and scale by isSelected/isHovered.
  float outlineFactor =
    edgeMask * (isSelected * selectedOutlineStrength + isHovered * hoverOutlineStrength);

  // Outline color (white by default) — you can swap for an accent color
  vec3 outlineColor = vec3(1.0);

  // blend outline lightly (mix keeps it thin)
  vec3 withOutline = mix(edgeShadedColor, outlineColor, clamp(outlineFactor, 0.0, 1.0));

  // final: clamp to avoid overbright artifacts
  gl_FragColor = vec4(clamp(withOutline, 0.0, 1.0), 1.0);
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
		uHovered: { value: number }
		uSelected: { value: number }
	}
}

const COUNT = 2500
const RADIUS = 3

export default function SphereOfColors({
	isDragging,
}: { isDragging: RefObject<boolean> }) {
	const [hoveredId, setHoveredId] = useState(-1)
	const [selectedId, setSelectedId] = useState(-1)
	const meshRef = useRef<InstancedMesh | null>(null)
	const matRef = useRef<BreathingMaterialUniforms>(null)
	const dummy = useMemo(() => new Object3D(), [])

	const { positions, colors } = useMemo(() => {
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
			const l = MathUtils.lerp(0.2, 0.69, i / COUNT)
			const c = new Color().setHSL(h, 0.9, l)
			// optional boost
			const rgb = [c.r, c.g, c.b]
			const idx = rgb.indexOf(Math.max(...rgb))
			rgb[idx] = Math.min(1, rgb[idx] * 1.6)
			color.setRGB(rgb[0], rgb[1], rgb[2])

			// write straight into the flat buffer (one pass)
			colors[i * 3 + 0] = color.r
			colors[i * 3 + 1] = color.g
			colors[i * 3 + 2] = color.b
		}
		return { positions, colors }
	}, [])

	// geometry memoized (do not recreate each render)
	const sphereGeo = useMemo(() => new SphereGeometry(0.06, 6, 6), [])

	// set instance matrices once (useLayoutEffect to be safe for GPU)
	useLayoutEffect(() => {
		if (!meshRef.current) return
		for (let i = 0; i < positions.length; i++) {
			dummy.position.copy(positions[i])
			dummy.updateMatrix()
			meshRef.current.setMatrixAt(i, dummy.matrix)
		}
		meshRef.current.instanceMatrix.needsUpdate = true
	}, [positions, dummy])

	useFrame(({ clock }) => {
		// update shader uniforms every frame
		if (!matRef.current) return
		matRef.current.uniforms.uTime.value = clock.getElapsedTime()
		matRef.current.uniforms.uHovered.value = hoveredId
		matRef.current.uniforms.uSelected.value = selectedId
	})

	const colorCache = useRef<(Color | null)[]>(Array(COUNT).fill(null))

	const getColorAt = (i: number) => {
		let c = colorCache.current[i]
		if (!c) {
			c = new Color().fromArray(colors, i * 3)
			colorCache.current[i] = c
		}
		return c
	}

	return (
		<instancedMesh
			ref={meshRef}
			args={[sphereGeo, undefined, COUNT]}
			rotation={[-0.8, 0.6, 0.05]}
			onPointerEnter={(e) => {
				e.stopPropagation()

				const id = typeof e.instanceId === 'number' ? e.instanceId : -1
				setHoveredId(id)

				if (isDragging.current) return
				document.body.style.cursor = 'pointer'
			}}
			onPointerMove={(e) => {
				e.stopPropagation()

				const id = typeof e.instanceId === 'number' ? e.instanceId : -1
				setHoveredId(id)

				if (isDragging.current) return
				document.body.style.cursor = 'pointer'
			}}
			onPointerOut={(e) => {
				e.stopPropagation()

				if (isDragging.current) return
				setHoveredId(() => {
					document.body.style.cursor = 'auto'
					return -1
				})
			}}
			onClick={(e) => {
				if (isDragging.current) return
				e.stopPropagation()

				document.body.style.cursor = 'pointer'
				const id = typeof e.instanceId === 'number' ? e.instanceId : -1
				setSelectedId(id)

				if (id >= 0) {
					const color = getColorAt(id)
					console.log('picked color', color.getStyle())
				}
			}}
		>
			<instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
			<breathingMaterial ref={matRef} attach="material" />
		</instancedMesh>
	)
}
