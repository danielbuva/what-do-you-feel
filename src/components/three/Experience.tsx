import SphereOfColors from '@/components/three/SphereOfColors'
import { Stars } from '@react-three/drei'
import { View } from './View'

export default function Experience() {
	return (
		<View>
			<ambientLight />
			<SphereOfColors />
			<Stars count={100} />
		</View>
	)
}
