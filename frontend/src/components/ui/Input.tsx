import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string
  /** A lucide icon element, shown inside the field on the left. */
  icon?: ReactNode
  /** Validation message from the backend. Turns the field red. */
  error?: string
  /** Grey helper text, hidden while an error is shown. */
  hint?: string
  /** Interactive element pinned to the right inside the field (e.g. a
      show/hide password toggle). Unlike `icon`, it stays clickable. */
  trailing?: ReactNode
}

/**
 * One text field with its label, optional icon, and its error/hint line.
 * The id is generated with useId() so the <label> is always correctly
 * tied to the input - that is what makes clicking the label focus the
 * field, and what screen readers rely on.
 */
export default function Input({ label, icon, error, hint, trailing, className, ...rest }: InputProps) {
  const id = useId()

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-900">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 text-gray-400" aria-hidden>
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-11 w-full rounded-lg border bg-white px-3.5 text-[15px] text-gray-900 transition',
            'placeholder:text-gray-400 hover:border-gray-300',
            'focus:outline-none focus:ring-[3px]',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
            icon && 'pl-10.5',
            trailing && 'pr-11',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/20',
            className,
          )}
          {...rest}
        />
        {trailing && <span className="absolute right-1.5 flex items-center">{trailing}</span>}
      </div>

      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  )
}
