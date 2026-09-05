interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
}

/**
 * Read-only display when onChange is omitted (review cards, property
 * summary); interactive 1-5 picker when it's passed (leave-a-review form).
 */
export default function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const interactive = typeof onChange === 'function'
  const starSizeClass = size === 'sm' ? 'text-base' : 'text-2xl'

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={`${starSizeClass} leading-none ${interactive ? 'cursor-pointer' : 'cursor-default'} ${
            star <= value ? 'text-amber-400' : 'text-gray-300'
          }`}
          aria-label={`${star} étoile(s)`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
