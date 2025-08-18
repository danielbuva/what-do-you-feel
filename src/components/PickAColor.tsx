import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'

export default function PickAColor() {
	const [color, setColor] = useState('#aabbcc')
	return (
		<div>
			what color is it?
			<HexColorPicker className="hi" color={color} onChange={setColor} />
		</div>
	)
}
