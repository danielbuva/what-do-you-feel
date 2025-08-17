import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { toggleVariants } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

const RadioGroupContext = React.createContext<
	VariantProps<typeof toggleVariants>
>({
	size: 'default',
	variant: 'default',
})

function ThemeGroup({
	className,
	variant,
	size,
	children,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root> &
	VariantProps<typeof toggleVariants>) {
	return (
		<RadioGroupPrimitive.Root
			data-slot="radio-group"
			className={cn(
				'flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs',
				className
			)}
			{...props}
		>
			<RadioGroupContext.Provider value={{ variant, size }}>
				{children}
			</RadioGroupContext.Provider>
		</RadioGroupPrimitive.Root>
	)
}

function ThemeSelection({
	className,
	children,
	variant,
	size,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> &
	VariantProps<typeof toggleVariants>) {
	const context = React.useContext(RadioGroupContext)

	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			data-variant={context.variant || variant}
			data-size={context.size || size}
			className={cn(
				toggleVariants({
					variant: context.variant || variant,
					size: context.size || size,
				}),
				'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l cursor-pointer',
				'data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground', // <- mimic selected state
				className
			)}
			{...props}
		>
			{children}
		</RadioGroupPrimitive.Item>
	)
}

export { ThemeGroup, ThemeSelection }
