import { type ReactNode, useRef } from 'react'
import Header from './Header'
import Scene from './three/Scene'

const Layout = ({ children }: { children: ReactNode }) => {
	const ref = useRef(null)

	return (
		<div
			ref={ref}
			style={{
				height: '100%',
				overflow: 'auto',
				position: 'relative',
				touchAction: 'auto',
				width: ' 100%',
			}}
		>
			<main
				className="flex min-h-screen select-none flex-col justify-between"
				// onPointerDown={() => {
				// 	document.body.style.cursor = 'grab'
				// }}
				// onPointerUp={() => {
				// 	document.body.style.cursor = 'auto'
				// }}
			>
				<Header />
				{children}
			</main>
			<Scene
				eventPrefix="client"
				eventSource={ref}
				style={{
					height: '100vh',
					width: '100vw',
					top: 0,
					left: 0,
					position: 'fixed',
					pointerEvents: 'none',
				}}
			/>
		</div>
	)
}

export { Layout }
