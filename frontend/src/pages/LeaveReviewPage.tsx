import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSubmitReview } from '@/features/reviews/useReviews'
import StarRating from '@/components/reviews/StarRating'
import { getErrorMessage } from '@/lib/apiErrors'

/**
 * Standalone page reachable by URL (/reservations/:reservationId/review)
 * — not linked from anywhere in the UI yet, since there's no "my
 * reservations" page to put a button on (that's Phase 19). Proper
 * integration comes then; this unblocks testing the review flow now.
 */
export default function LeaveReviewPage() {
  const { reservationId } = useParams<{ reservationId: string }>()
  const submitReview = useSubmitReview(reservationId ?? '')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submitReview.mutate({ rating, comment })
  }

  if (submitReview.isSuccess) {
    const review = submitReview.data
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-700">
          Merci pour votre avis !
        </div>
        <Link to={`/properties/${review.property_id}`} className="mt-4 inline-block text-brand-600 transition hover:underline">
          Voir la propriété
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-brand-700">Laisser un avis</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Note</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div>
          <label htmlFor="comment" className="mb-1 block text-sm font-medium text-gray-700">
            Commentaire
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {submitReview.isError && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(submitReview.error)}
          </div>
        )}

        <button
          type="submit"
          disabled={submitReview.isPending || rating === 0}
          className="w-full rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2 text-white font-semibold shadow-lg shadow-brand-900/30 transition hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl hover:shadow-brand-900/40 active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
        >
          {submitReview.isPending ? 'Envoi...' : 'Envoyer mon avis'}
        </button>
      </form>
    </main>
  )
}
