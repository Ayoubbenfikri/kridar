import { usePropertyReviews } from '@/features/reviews/useReviews'
import ReviewCard from './ReviewCard'

/**
 * Read-only for now — no "leave a review" button here, since that needs
 * a completed reservation and there's no "my reservations" page yet
 * (Phase 19). The form exists as a standalone page reachable by its
 * reservation id in the meantime (LeaveReviewPage).
 */
export default function ReviewsSection({ propertyId }: { propertyId: string }) {
  const { data, isLoading, isError } = usePropertyReviews(propertyId)

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h2 className="mb-4 font-semibold text-brand-700">Avis</h2>

      {isLoading && <p className="text-sm text-gray-500">Chargement des avis...</p>}
      {isError && <p className="text-sm text-red-600">Impossible de charger les avis.</p>}

      {data && data.data.length === 0 && <p className="text-sm text-gray-500">Aucun avis pour le moment.</p>}

      {data && data.data.length > 0 && (
        <div>
          {data.data.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}
