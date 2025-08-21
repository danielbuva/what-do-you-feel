import { Hud, PerspectiveCamera } from '@react-three/drei'
import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry } from 'three'

type ThreeButtonAttachedProps = {
	onClick?: () => void
	color?: string
}

export default function ThreeButtonAttached({
	onClick,
}: ThreeButtonAttachedProps) {
	const geometry = useMemo(() => {
		const geom = new BufferGeometry()
		const vertices = new Float32Array([
			-0.5,
			0,
			0, // top
			-0.5,
			-0.5,
			0, // bottom left
			0.5,
			-0.25,
			0, // bottom right
		])
		geom.setAttribute('position', new BufferAttribute(vertices, 3))
		geom.computeVertexNormals()
		return geom
	}, [])

	return (
		<Hud>
			<PerspectiveCamera makeDefault position={[-2.2, 1.25, 3]} />
			<mesh
				geometry={geometry}
				position={[0.8, -0.8, -2]} // relative to camera
				scale={0.3}
				onPointerEnter={() => {
					document.body.style.cursor = 'pointer'
				}}
				onPointerOut={() => {
					document.body.style.cursor = 'auto'
				}}
				onClick={onClick}
			>
				<meshBasicMaterial color="lime" />
			</mesh>
		</Hud>
	)
}
