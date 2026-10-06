import { useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, TriangleAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useReplyToReview } from '@/features/reviews/useReviews'
import { getErrorMessage } from '@/lib/apiErrors'
import { Button, Card, Textarea, buttonClasses } from '@/components/ui'

/**
 * /reviews/:reviewId/reply - the owner's public answer to a review.
 * ReviewPolicy checks server-side that the current user really owns the
 * reviewed property.
 */
export default function OwnerReplyPage() {
  const { t } = useTranslation()
  const { reviewId } = useParams<{ reviewId: string }>()
  const replyToReview = useReplyToReview(reviewId ?? '')
  const [ownerReply, setOwnerReply] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    replyToReview.mutate({ owner_reply: ownerReply })
  }

  if (replyToReview.isSuccess) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-14 sm:px-6">
        <Card className="p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <CheckCircle2 className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">{t('ownerReply.sentTitle')}</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {t('ownerReply.sentText')}
          </p>
          <Link to="/owner" className={buttonClasses({ variant: 'secondary', className: 'mt-6' })}>
            {t('ownerReply.backToOwner')}
          </Link>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
      <Link
        to="/owner"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('ownerReply.back')}
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{t('ownerReply.title')}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {t('ownerReply.subtitle')}
      </p>

      <Card className="mt-6 p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Textarea
            label={t('ownerReply.label')}
            required
            rows={5}
            placeholder={t('ownerReply.placeholder')}
            value={ownerReply}
            onChange={(event) => setOwnerReply(event.target.value)}
          />

          {replyToReview.isError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {getErrorMessage(replyToReview.error)}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            disabled={ownerReply.trim().length === 0}
            isLoading={replyToReview.isPending}
          >
            {replyToReview.isPending ? t('ownerReply.sending') : t('ownerReply.submit')}
          </Button>
        </form>
      </Card>
    </main>
  )
}
