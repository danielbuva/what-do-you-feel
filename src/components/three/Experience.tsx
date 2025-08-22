import SphereOfColors from '@/components/three/SphereOfColors'
import { CameraShake, TrackballControls } from '@react-three/drei'
import { useRef } from 'react'
import type { TrackballControls as TrackballControlsImpl } from 'three-stdlib'
import { View } from './View'

export default function Experience() {
	const isDragging = useRef(false)
	const trackballControlsRef = useRef<TrackballControlsImpl | null>(null)

	return (
		<View>
			<TrackballControls
				ref={trackballControlsRef}
				makeDefault
				minDistance={0.5}
				maxDistance={69}
				zoomSpeed={0.69}
				noPan
				staticMoving
				rotateSpeed={2}
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
			<SphereOfColors
				isDragging={isDragging}
				// orbitControlsRef={orbitControlsRef}
				trackballControlsRef={trackballControlsRef}
			/>
		</View>
	)
}
