import { Slider } from '@/components/ui/slider'
import type { OrbMaterialUniforms } from '@/lib/three/Orb'
import { cn } from '@/lib/utils'
import { type RefObject, useRef } from 'react'

export default function SceneOptions({
	scene,
	optionsRef,
	orbMatRef,
}: {
	scene: { confirm: () => void; back: () => void }[]
	optionsRef: RefObject<HTMLDivElement | null>
	orbMatRef: RefObject<OrbMaterialUniforms | null>
}) {
	const sceneIndex = useRef(0)
	return (
		<>
			<div className="z-10 flex justify-between p-10">
				<button
					className={cn('cursor-pointer opacity-0', {
						'opacity-100': sceneIndex.current > 0,
					})}
					type="button"
					onClick={() => {
						scene[sceneIndex.current - 1].back()
						sceneIndex.current--
					}}
				>
					back
				</button>
				<button
					type="button"
					className="cursor-pointer"
					onClick={() => {
						scene[sceneIndex.current].confirm()
						sceneIndex.current++
					}}
				>
					continue
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
