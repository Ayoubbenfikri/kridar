import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

// Oct 2026 refresh: rounder corners, a small press effect (active:scale)
// and, for the filled variants, a gentle top-to-bottom gradient + soft
// coloured glow + thin top highlight instead of one flat colour. Every
// <Button> and buttonClasses() link picks it up from here - no page
// restyles its buttons by hand. The hero search button keeps its own
// stronger left-to-right sheen (SearchBar.tsx), on purpose.
const BASE_CLASS =
  'inline-flex items-center justify-center rounded-xl font-semibold whitespace-nowrap transition active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/30 ' +
  // pointer-events-none on a disabled button also kills its hover state,
  // so a disabled button never lifts or changes colour.
  'disabled:pointer-events-none disabled:opacity-50'

// Gradients stay between the -600 and -700/-800 shades: white text keeps a
// 4.8:1+ contrast over the whole button, whatever its width.
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-b from-brand-600 to-brand-700 text-white ' +
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_6px_16px_-6px_rgb(15_118_110/0.5)] ' +
    'hover:-translate-y-px hover:from-brand-700 hover:to-brand-800 ' +
    'hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_10px_22px_-8px_rgb(15_118_110/0.6)]',
  secondary:
    'border border-gray-200 bg-white text-brand-700 shadow-sm ' +
    'hover:-translate-y-px hover:border-brand-300 hover:bg-brand-50/60 hover:shadow-md',
  ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
  danger:
    'bg-linear-to-b from-red-600 to-red-700 text-white ' +
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_6px_16px_-6px_rgb(220_38_38/0.45)] ' +
    'hover:-translate-y-px hover:from-red-700 hover:to-red-800',
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
