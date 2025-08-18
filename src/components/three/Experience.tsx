import SphereOfColors from '@/components/three/SphereOfColors'
import { OrbitControls, Stars } from '@react-three/drei'
import { useRef } from 'react'
import { View } from './View'

export default function Experience() {
	const isDragging = useRef(false)

	return (
		<View>
			<OrbitControls
				makeDefault
				minDistance={5}
				maxDistance={69}
				zoomSpeed={0.69}
				enablePan={false}
				enableDamping={false}
				onEnd={() => {
					isDragging.current = false
					document.body.style = 'auto'
				}}
				onChange={() => {
					isDragging.current = true
					document.body.style.cursor = 'grab'
				}}
			/>
			<ambientLight />
			<SphereOfColors isDragging={isDragging} />
			<Stars count={100} />
		</View>
	)
}
