import { tunnel } from '@/lib/utils'
import { Preload } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

export default function Scene({ ...props }) {
	// Everything defined in here will persist between route changes, only children are swapped
	return (
		<Canvas
			{...props}
			camera={{
				fov: 70,
				position: [4, 4, 4],
			}}
		>
			<Preload all />
			<tunnel.Out />
		</Canvas>
	)
}
