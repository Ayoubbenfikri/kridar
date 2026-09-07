import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
}

/**
 * Read-only display when onChange is omitted (review cards, property
 * summary); interactive 1-5 picker when it is passed (leave-a-review
 * form). In read-only mode the stars are plain <span>s, not disabled
 * buttons - a rating you cannot change should not be in the tab order.
 */
export default function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const interactive = typeof onChange === 'function'
  const starClass = size === 'sm' ? 'size-4' : 'size-6'

  if (!interactive) {
    return (
      <div className="flex gap-0.5" role="img" aria-label={`Note : ${value} sur 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            aria-hidden
            className={cn(starClass, star <= value ? 'fill-accent text-accent' : 'text-gray-300')}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`Donner ${star} etoile${star > 1 ? 's' : ''}`}
          aria-pressed={star <= value}
          className="rounded transition hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-brand-500/30 focus-visible:outline-none"
        >
          <Star
            aria-hidden
            className={cn(starClass, star <= value ? 'fill-accent text-accent' : 'text-gray-300')}
          />
        </button>
      ))}
    </div>
  )
}
