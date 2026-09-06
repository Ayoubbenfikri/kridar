import { cn } from '@/lib/cn'

/**
 * Grey placeholder block shown while data loads, instead of a blank page
 * or a "Chargement..." line. Give it the rough shape of the content that
 * is coming (`h-4 w-2/3` for a title, an aspect ratio for an image) so
 * the page does not jump when the real content arrives.
 * The sweeping animation itself lives in index.css (.skeleton).
 */
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-md', className)} />
}
