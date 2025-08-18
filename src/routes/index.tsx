import Experience from '@/components/three/Experience'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: App,
})

function App() {
	return (
		<>
			{/* <header className="min-h-screen flex flex-col items-center justify-center" /> */}
			<Experience />
		</>
	)
}
