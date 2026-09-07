import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label?: string
  error?: string
  hint?: string
}

/**
 * Same anatomy as <Input> (label, error, hint, useId-linked label) so a
 * form mixing text fields and dropdowns lines up without any per-page
 * tweaking. appearance-none + our own chevron keeps the control looking
 * the same across browsers.
 */
export default function Select({ label, error, hint, className, children, ...rest }: SelectProps) {
  const id = useId()

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-900">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-11 w-full appearance-none rounded-lg border bg-white pr-10 pl-3.5 text-[15px] text-gray-900 transition',
            'hover:border-gray-300 focus:ring-[3px] focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/20',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
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
