import type { Review } from '@/types/review'
import StarRating from './StarRating'

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-800">{review.guest.name}</span>
        <StarRating value={review.rating} size="sm" />
      </div>
      <p className="mt-2 text-gray-700">{review.comment}</p>

      {review.owner_reply && (
        <div className="mt-3 rounded-lg bg-brand-50 p-3">
          <p className="text-sm font-medium text-brand-700">Réponse du propriétaire</p>
          <p className="mt-1 text-sm text-gray-700">{review.owner_reply}</p>
        </div>
      )}
    </div>
  )
}
