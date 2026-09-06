import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Adds the hover feedback (lifts 4px, deeper shadow). Only use it when
   * the whole card is clickable or leads somewhere - a static block that
   * moves under the cursor for no reason is noise.
   */
  interactive?: boolean
}

/**
 * The surface every block in the app sits on: white, hairline border,
 * very soft shadow, 12px radius. Keeping this in one place is what stops
 * five slightly different "cards" appearing across the pages.
 */
export default function Card({ interactive = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        interactive && 'transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
