import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'teal' | 'green' | 'amber' | 'slate' | 'red'

const TONE_CLASS: Record<BadgeTone, string> = {
  teal: 'border-brand-100 bg-brand-50 text-brand-700',
  green: 'border-green-200 bg-green-50 text-green-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  slate: 'border-gray-200 bg-gray-100 text-gray-600',
  red: 'border-red-200 bg-red-50 text-red-700',
}

/**
 * Small status pill (Publiee, En attente, Annulee...). Tones are named by
 * colour rather than by meaning on purpose: each page maps its own domain
 * statuses onto a tone, so one status renaming never forces a change here.
 */
export default function Badge({
  tone = 'slate',
  icon,
  className,
  children,
}: {
  tone?: BadgeTone
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        TONE_CLASS[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
