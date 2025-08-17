import ThemeToggle from '@/components/ui/ThemeToggle'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: App,
})

function App() {
	return (
		<div className="text-center">
			<header className="min-h-screen flex flex-col items-center justify-center text-[calc(10px+2vmin)]">
				hi
			</header>
		</div>
	)
}
