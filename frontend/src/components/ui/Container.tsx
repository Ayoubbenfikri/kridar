import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Horizontal frame for page content: one max width and one set of side
 * paddings for the whole app, so every page lines up with the navbar.
 * `size` widens it for grid-heavy pages (listings, dashboard).
 */
export default function Container({
  size = 'md',
  className,
  children,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}) {
  const width = { sm: 'max-w-3xl', md: 'max-w-5xl', lg: 'max-w-7xl' }[size]

  return <div className={cn('mx-auto w-full px-4 sm:px-6', width, className)}>{children}</div>
}
