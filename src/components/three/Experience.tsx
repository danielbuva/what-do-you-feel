import SphereOfColors from '@/components/three/SphereOfColors'
import { CameraShake, OrbitControls, Stars } from '@react-three/drei'
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
			<CameraShake
				// i think:
				maxYaw={0.05} // vertial axis rotation
				maxPitch={0.05} // side to side axis/ lateral/ up and down
				maxRoll={0.05} // front to back axis/ longitudinal
				yawFrequency={0.05}
				pitchFrequency={0.05}
				rollFrequency={0.05}
				intensity={0.8}
				decayRate={0.69}
			/>
			<ambientLight />
			<SphereOfColors isDragging={isDragging} />
			<Stars count={100} />
		</View>
	)
}
