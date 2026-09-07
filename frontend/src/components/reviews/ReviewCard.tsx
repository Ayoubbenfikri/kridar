import { User } from 'lucide-react'
import type { Review } from '@/types/review'
import StarRating from './StarRating'

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="border-b border-gray-100 py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <User className="size-4" aria-hidden />
          </span>
          <span className="font-medium text-gray-900">{review.guest.name}</span>
        </div>
        <StarRating value={review.rating} size="sm" />
      </div>

      <p className="mt-3 text-gray-600">{review.comment}</p>

      {review.owner_reply && (
        <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 p-3.5">
          <p className="text-sm font-semibold text-brand-700">Réponse du propriétaire</p>
          <p className="mt-1 text-sm text-gray-700">{review.owner_reply}</p>
        </div>
      )}
    </article>
  )
}
