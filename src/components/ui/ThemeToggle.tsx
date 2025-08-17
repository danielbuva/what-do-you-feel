import { LaptopMinimalIcon, MoonIcon, SunIcon } from 'lucide-react'
import { ThemeGroup, ThemeSelection } from './theme-selector'

export default function ThemeToggle() {
	return (
		<ThemeGroup
			defaultChecked={true}
			defaultValue={localStorage.getItem('theme') ?? 'sys'}
			onValueChange={(theme) => setTheme(theme)}
			variant="outline"
		>
			<ThemeSelection value="light">
				<SunIcon />
			</ThemeSelection>
			<ThemeSelection value="dark">
				<MoonIcon />
			</ThemeSelection>
			<ThemeSelection value="sys">
				<LaptopMinimalIcon />
			</ThemeSelection>
		</ThemeGroup>
	)
}

function setTheme(theme: string) {
	if (theme === 'sys') {
		localStorage.removeItem('theme')
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
		return
	}

	localStorage.setItem('theme', theme)

	if (theme === 'dark') {
		document.documentElement.classList.add('dark')
	} else {
		document.documentElement.classList.remove('dark')
	}
}
