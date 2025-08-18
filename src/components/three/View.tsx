import { tunnel } from '@/lib/utils'
import { View as ViewImpl } from '@react-three/drei'
import {
	type ReactNode,
	type Ref,
	type RefObject,
	forwardRef,
	useImperativeHandle,
	useRef,
} from 'react'

interface ViewProps {
	children?: ReactNode
	className?: string
}

const View = forwardRef<HTMLDivElement, ViewProps>(
	({ children, className, ...props }, ref: Ref<HTMLDivElement | null>) => {
		const localRef = useRef<HTMLDivElement>(null)
		useImperativeHandle(ref, () => localRef.current as HTMLDivElement)

		return (
			<>
				<div
					className="absolute top-0 min-h-screen sm:w-full"
					ref={localRef}
					{...props}
				/>
				<tunnel.In>
					<ViewImpl track={localRef as RefObject<HTMLElement>}>
						{children}
					</ViewImpl>
				</tunnel.In>
			</>
		)
	}
)

View.displayName = 'View'

export { View }
