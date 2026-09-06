import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const BASE_CLASS =
  'inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition ' +
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/30 ' +
  // pointer-events-none on a disabled button also kills its hover state,
  // so a disabled button never lifts or changes colour.
  'disabled:pointer-events-none disabled:opacity-50'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:-translate-y-px hover:bg-brand-700 hover:shadow-md',
  secondary:
    'border border-gray-200 bg-white text-brand-600 hover:-translate-y-px hover:border-brand-500 hover:bg-brand-50',
  ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-red-600 text-white hover:-translate-y-px hover:bg-red-700 hover:shadow-md',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-5 text-[15px]',
}

/**
 * The class string behind <Button>. Exported on its own because a
 * react-router <Link> cannot be a <button>, and we want a link that
 * looks like a button to be styled from the exact same source:
 *
 *   <Link to="/x" className={buttonClasses({ variant: 'primary' })}>
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
} = {}): string {
  return cn(BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], fullWidth && 'w-full', className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  /** Shows a spinner and disables the button. Use for pending mutations. */
  isLoading?: boolean
  /** Rendered before the label - pass a lucide icon element. */
  icon?: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}
