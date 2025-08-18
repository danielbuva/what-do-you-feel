import { tunnel } from '@/lib/utils'
import { CameraShake, Preload } from '@react-three/drei'
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
			<tunnel.Out />
			<Preload all />

			{/* <CameraShake
				// i think:
				maxYaw={0.05} // vertial axis rotation
				maxPitch={0.05} // side to side axis/ lateral/ up and down
				maxRoll={0.05} // front to back axis/ longitudinal
				yawFrequency={0.05}
				pitchFrequency={0.05}
				rollFrequency={0.05}
				intensity={0.8}
				decayRate={0.69}
			/> */}
		</Canvas>
	)
}
