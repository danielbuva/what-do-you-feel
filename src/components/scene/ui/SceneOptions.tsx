import { Slider } from '@/components/ui/slider'
import type { OrbMaterialUniforms } from '@/lib/three/Orb'
import { type RefObject, useRef } from 'react'

export default function SceneOptions({
	confirm,
	optionsRef,
	orbMatRef,
}: {
	confirm: (() => void)[]
	optionsRef: RefObject<HTMLDivElement | null>
	orbMatRef: RefObject<OrbMaterialUniforms | null>
}) {
	const sceneIndex = useRef(0)
	return (
		<>
			<div className="z-10 border-2 border-red-500 flex">
				<button
					type="button"
					className="cursor-pointer"
					onClick={() => {
						confirm[sceneIndex.current]()
						sceneIndex.current++
					}}
				>
					okay
				</button>
			</div>
			<div
				ref={optionsRef}
				className="border-2 border-[#c0c0c0a9] rounded-md px-4 py-2 w-52 absolute right-[5%] z-10 bottom-[15%]  h-40 flex bg-[#c0c0c02f] flex-col gap-2 opacity-0"
			>
				<p>noise</p>
				<Slider
					defaultValue={[0]}
					min={0}
					max={1}
					step={0.01}
					onValueChange={(val) => {
						if (orbMatRef.current) {
							orbMatRef.current.uniforms.uNoise.value = val[0]
						}
					}}
					aria-label="noise"
				/>
			</div>
		</>
	)
}
