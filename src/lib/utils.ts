import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import tunnelRat from 'tunnel-rat'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const tunnel = tunnelRat()
export const uiTunnel = tunnelRat()
