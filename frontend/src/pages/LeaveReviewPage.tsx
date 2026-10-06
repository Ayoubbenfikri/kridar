import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, TriangleAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useSubmitReview } from '@/features/reviews/useReviews'
import StarRating from '@/components/reviews/StarRating'
import { getErrorMessage } from '@/lib/apiErrors'
import { Button, Card, Textarea, buttonClasses } from '@/components/ui'

/**
 * /reservations/:reservationId/review - reached from "Mes reservations"
 * on a completed stay. The backend decides whether the review is
 * allowed (completed reservation, not already reviewed); this page just
 * surfaces its answer.
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
      <main className="mx-auto w-full max-w-lg px-4 py-14 sm:px-6">
        <Card className="p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <CheckCircle2 className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Merci pour votre avis</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Il est maintenant visible sur la page du logement.
          </p>
          <Link
            to={`/properties/${review.property_id}`}
            className={buttonClasses({ className: 'mt-6' })}
          >
            Voir la propriété
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
      <Link
        to="/reservations"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mes réservations
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">Laisser un avis</h1>
      <p className="mt-1 text-sm text-gray-500">Votre retour aide les prochains voyageurs.</p>

      <Card className="mt-6 p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <span className="mb-2 block text-sm font-semibold text-gray-900">Note</span>
            <StarRating value={rating} onChange={setRating} />
            <p className="mt-2 text-xs text-gray-500">
              {rating === 0 ? 'Choisissez une note pour continuer.' : `${rating} sur 5`}
            </p>
          </div>

          <Textarea
            label="Commentaire"
            required
            rows={5}
            placeholder="Comment s'est passé votre séjour ?"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />

          {submitReview.isError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {getErrorMessage(submitReview.error)}
            </div>
          )}

          <Button type="submit" fullWidth disabled={rating === 0} isLoading={submitReview.isPending}>
            {submitReview.isPending ? 'Envoi...' : 'Envoyer mon avis'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
