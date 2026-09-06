import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useReplyToReview } from '@/features/reviews/useReviews'
import { getErrorMessage } from '@/lib/apiErrors'

/**
 * Standalone page reachable by URL (/reviews/:reviewId/reply) — same
 * reasoning as LeaveReviewPage: no owner dashboard yet (Phase 20) to
 * put a "reply" button on.
 */
export default function OwnerReplyPage() {
  const { reviewId } = useParams<{ reviewId: string }>()
  const replyToReview = useReplyToReview(reviewId ?? '')
  const [ownerReply, setOwnerReply] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    replyToReview.mutate({ owner_reply: ownerReply })
  }

  if (replyToReview.isSuccess) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-700">
          Réponse envoyée.
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-brand-700">Répondre à cet avis</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="owner_reply" className="mb-1 block text-sm font-medium text-gray-700">
            Votre réponse
          </label>
          <textarea
            id="owner_reply"
            value={ownerReply}
            onChange={(event) => setOwnerReply(event.target.value)}
            rows={4}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {replyToReview.isError && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(replyToReview.error)}
          </div>
        )}

        <button
          type="submit"
          disabled={replyToReview.isPending || ownerReply.trim().length === 0}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-white transition hover:scale-[1.02] hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {replyToReview.isPending ? 'Envoi...' : 'Répondre'}
        </button>
      </form>
    </main>
  )
}
