import ThemeToggle from './ui/ThemeToggle'

export default function Header() {
	return (
		<header className="p-2 flex gap-2 justify-between">
			<nav className="flex flex-row">
				<ThemeToggle />
			</nav>
		</header>
	)
}
