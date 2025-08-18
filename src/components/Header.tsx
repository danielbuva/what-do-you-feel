import ThemeToggle from './ui/ThemeToggle'

export default function Header() {
	return (
		<header className="p-2 flex gap-2 justify-between z-10 overflow-hidden">
			<nav className="flex flex-row">
				<ThemeToggle />
			</nav>
		</header>
	)
}
