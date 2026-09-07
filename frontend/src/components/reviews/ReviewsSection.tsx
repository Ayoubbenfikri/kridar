import { MessageSquare } from 'lucide-react'
import { usePropertyReviews } from '@/features/reviews/useReviews'
import { Skeleton } from '@/components/ui'
import ReviewCard from './ReviewCard'

/**
 * Read-only: leaving a review requires a completed reservation, so the
 * form lives on its own page reached from "Mes reservations"
 * (LeaveReviewPage), not here.
 */
export default function ReviewsSection({ propertyId }: { propertyId: string }) {
  const { data, isError } = usePropertyReviews(propertyId)

  return (
    <section className="mt-8 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-gray-900">
        Avis {data && data.data.length > 0 && <span className="text-gray-400">({data.data.length})</span>}
      </h2>

      {/* Exhaustive: error -> not loaded yet -> empty -> list. */}
      {isError ? (
        <p className="mt-3 text-sm text-red-600">Impossible de charger les avis.</p>
      ) : !data ? (
        <div className="mt-4 space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : data.data.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
          <MessageSquare className="size-5 shrink-0 text-gray-400" aria-hidden />
          Aucun avis pour le moment. Les avis apparaissent apres un sejour termine.
        </div>
      ) : (
        <div className="mt-2">
          {data.data.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  )
}
