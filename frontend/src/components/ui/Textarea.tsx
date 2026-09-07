import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label?: string
  error?: string
  hint?: string
}

/** Multi-line counterpart of <Input>, same label/error/hint anatomy. */
export default function Textarea({ label, error, hint, className, rows = 5, ...rest }: TextareaProps) {
  const id = useId()

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-900">
          {label}
        </label>
      )}

      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-gray-900 transition',
          'placeholder:text-gray-400 hover:border-gray-300 focus:ring-[3px] focus:outline-none',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/20',
          className,
        )}
        {...rest}
      />

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
