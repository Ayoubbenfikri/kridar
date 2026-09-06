import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * What a list shows when it has nothing in it. Always three parts: an
 * icon, one short sentence saying why it is empty, and - when there is
 * something useful to do - a single action. Never a bare "Aucun resultat".
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  /** A lucide icon element, e.g. <Inbox className="size-6" />. */
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm',
        className,
      )}
    >
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <h3 className="text-[17px] font-semibold text-gray-900">{title}</h3>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
