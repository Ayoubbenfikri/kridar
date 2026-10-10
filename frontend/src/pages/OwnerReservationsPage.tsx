import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import {
  AlertCircle,
  CalendarX,
  Check,
  MapPin,
  MessageSquare,
  Send,
  TriangleAlert,
  User,
  X,
} from 'lucide-react'
import {
  useCancelReservationAsOwner,
  useConfirmReservation,
  useOwnerReservations,
  useRejectReservation,
} from '@/features/owner/useOwner'
import { useStartConversationWithGuest } from '@/features/messaging/useMessaging'
import { getErrorMessage } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import { formatDate } from '@/lib/formatDate'
import ReservationStatusBadge from '@/components/reservations/ReservationStatusBadge'
import ShareListingPicker from '@/components/messaging/ShareListingPicker'
import type { ShareableListing } from '@/components/messaging/ShareListingPicker'
import { Button, Card, EmptyState, Pagination, Skeleton, Textarea, useToast } from '@/components/ui'
import type { Reservation } from '@/types/reservation'

/**
 * Phase 22 (pricing): what the owner actually receives on this booking.
 *
 * Every figure is read from the reservation, never recomputed here —
 * they were snapshotted at booking time, so an owner looking at an old
 * reservation sees the rate that applied then, not today's.
 */
function Payout({ reservation }: { reservation: Reservation }) {
  const { t } = useTranslation()
  const commission = Number(reservation.commission_amount)

  if (commission <= 0) {
    return (
      <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
        <Trans
          i18nKey="ownerReservations.payoutNoCommission"
          values={{ amount: formatMad(reservation.total_price) }}
          components={{ strong: <strong className="text-gray-900" /> }}
        />
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-sm">
      <span className="text-gray-600">
        <Trans
          i18nKey="ownerReservations.payoutCommission"
          values={{
            rate: Number(reservation.commission_rate),
            amount: formatMad(reservation.commission_amount),
          }}
          components={{ strong: <strong className="text-gray-900" /> }}
        />
      </span>
      <span className="font-semibold text-brand-700">
        {t('ownerReservations.payoutReceive', { amount: formatMad(reservation.owner_amount) })}
      </span>
    </div>
  )
}

/**
 * /owner/reservations - the requests received on the current user's
 * properties. Confirm / reject apply to a pending request; cancelling a
 * confirmed one asks for an optional reason, exactly as the guest side
 * does. Every action goes through the same endpoints as before, with
 * ReservationPolicy checking ownership server-side.
 */
export default function OwnerReservationsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const navigate = useNavigate()

  const { showToast } = useToast()
  const { data, isError, error, isFetching } = useOwnerReservations(page)
  const confirmMutation = useConfirmReservation()
  const rejectMutation = useRejectReservation()
  const cancelMutation = useCancelReservationAsOwner()
  const startConversation = useStartConversationWithGuest()

  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Inline composer, same pattern as the cancel-reason box below: one
  // reservation's "Contacter" button open at a time.
  const [messagingId, setMessagingId] = useState<number | null>(null)
  const [messageBody, setMessageBody] = useState('')
  const [sharedListing, setSharedListing] = useState<ShareableListing | null>(null)

  function startMessaging(reservationId: number) {
    setMessagingId(reservationId)
    setMessageBody('')
    setSharedListing(null)
  }

  function sendMessage(reservation: Reservation) {
    const trimmed = messageBody.trim()
    if (trimmed === '' || !reservation.guest) return

    startConversation.mutate(
      {
        propertyId: reservation.property.id,
        guestId: reservation.guest.id,
        body: trimmed,
        shared: sharedListing?.attachment,
      },
      {
        // Same find-or-continue as ContactOwnerCard: land on whichever
        // thread came back, new or already existing.
        onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
      },
    )
  }

  /**
   * "Envoyer l'annonce" — the picker's own dedicated button, same idea as
   * ConversationPage's sendSharedListing(): sends the listing right away
   * with a short default caption, with nothing required in the Textarea.
   */
  function sendSharedListingOnly(reservation: Reservation) {
    if (!reservation.guest || !sharedListing) return

    startConversation.mutate(
      {
        propertyId: reservation.property.id,
        guestId: reservation.guest.id,
        body: t('ownerReservations.sharedCaption', { title: sharedListing.title }),
        shared: sharedListing.attachment,
      },
      {
        onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
      },
    )
  }

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startCancelling(reservationId: number) {
    setCancellingId(reservationId)
    setCancelReason('')
  }

  function confirmCancel(reservationId: number) {
    cancelMutation.mutate(
      { reservationId, reason: cancelReason || undefined },
      {
        onSuccess: () => {
          setCancellingId(null)
          showToast('success', t('ownerReservations.cancelledToast'))
        },
      },
    )
  }

  const isDeciding = confirmMutation.isPending || rejectMutation.isPending

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('ownerReservations.title')}</h1>
      {data && (
        <p className="mt-1 text-sm text-gray-500">
          {t('ownerReservations.count', { n: data.meta.total })}
        </p>
      )}

      <div className="mt-6">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            {getErrorMessage(error)}
          </Card>
        ) : !data ? (
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={<CalendarX className="size-6" />}
            title={t('ownerReservations.emptyTitle')}
            description={t('ownerReservations.emptyDescription')}
          />
        ) : (
          <>
            <div className={`space-y-4 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              {data.data.map((reservation) => (
                <Card key={reservation.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        to={`/properties/${reservation.property.id}`}
                        className="block truncate font-semibold text-gray-900 transition hover:text-brand-600"
                      >
                        {reservation.property.title}
                      </Link>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <User className="size-3.5 shrink-0" aria-hidden />
                        {reservation.guest?.name ?? t('owner.dashboard.guestFallback')}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        {reservation.property.city}
                      </p>
                    </div>
                    <ReservationStatusBadge status={reservation.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                        {t('reservations.arrival')}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(reservation.start_date)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                        {t('reservations.departure')}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(reservation.end_date)}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 sm:col-span-1">
                      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                        {t('ownerReservations.paidByGuest')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatMad(reservation.total_price)}
                      </p>
                    </div>
                  </div>

                  <Payout reservation={reservation} />

                  {reservation.cancellation_reason && (
                    <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      {t('reservations.cancellationReason', { reason: reservation.cancellation_reason })}
                    </p>
                  )}

                  {(reservation.status === 'pending' ||
                    (reservation.status === 'confirmed' && cancellingId !== reservation.id)) && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                      {reservation.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            icon={<Check className="size-4" />}
                            disabled={isDeciding}
                            isLoading={
                              confirmMutation.isPending && confirmMutation.variables === reservation.id
                            }
                            onClick={() =>
                              confirmMutation.mutate(reservation.id, {
                                onSuccess: () => showToast('success', t('ownerReservations.confirmedToast')),
                              })
                            }
                          >
                            {t('ownerReservations.confirm')}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<X className="size-4" />}
                            disabled={isDeciding}
                            isLoading={
                              rejectMutation.isPending && rejectMutation.variables === reservation.id
                            }
                            onClick={() =>
                              rejectMutation.mutate(reservation.id, {
                                onSuccess: () => showToast('info', t('ownerReservations.rejectedToast')),
                              })
                            }
                          >
                            {t('ownerReservations.reject')}
                          </Button>
                        </>
                      )}

                      {reservation.status === 'confirmed' && (
                        <Button size="sm" variant="ghost" onClick={() => startCancelling(reservation.id)}>
                          {t('ownerReservations.cancelReservation')}
                        </Button>
                      )}
                    </div>
                  )}

                  {cancellingId === reservation.id && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <Textarea
                        label={t('reservations.cancelReasonLabel')}
                        rows={2}
                        value={cancelReason}
                        onChange={(event) => setCancelReason(event.target.value)}
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={cancelMutation.isPending}
                          onClick={() => confirmCancel(reservation.id)}
                        >
                          {t('reservations.confirmCancel')}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setCancellingId(null)}>
                          {t('reservations.back')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Reach out to the guest about this booking — the
                      owner-initiated counterpart to ContactOwnerCard.
                      Shown whatever the reservation's status, since an
                      owner may want to follow up on an old or cancelled
                      booking too; the backend confirms this guest really
                      has a reservation here either way. */}
                  {reservation.guest && messagingId !== reservation.id && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<MessageSquare className="size-4" />}
                        onClick={() => startMessaging(reservation.id)}
                      >
                        {t('ownerReservations.contact', { name: reservation.guest.name })}
                      </Button>
                    </div>
                  )}

                  {messagingId === reservation.id && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3">
                        <ShareListingPicker
                          selected={sharedListing}
                          onSelect={setSharedListing}
                          onClear={() => setSharedListing(null)}
                          onSend={() => sendSharedListingOnly(reservation)}
                          isSending={startConversation.isPending}
                        />
                      </div>
                      <Textarea
                        label={t('ownerReservations.yourMessage')}
                        rows={3}
                        maxLength={2000}
                        placeholder={t('ownerReservations.messagePlaceholder')}
                        value={messageBody}
                        onChange={(event) => setMessageBody(event.target.value)}
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          icon={<Send className="size-4" />}
                          disabled={messageBody.trim() === ''}
                          isLoading={startConversation.isPending}
                          onClick={() => sendMessage(reservation)}
                        >
                          {t('ownerReservations.send')}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setMessagingId(null)}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                      {startConversation.isError && (
                        <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
                          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                          {getErrorMessage(startConversation.error)}
                        </p>
                      )}
                    </div>
                  )}

                  {(confirmMutation.isError || rejectMutation.isError) &&
                    (confirmMutation.variables === reservation.id ||
                      rejectMutation.variables === reservation.id) && (
                      <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {getErrorMessage(confirmMutation.error ?? rejectMutation.error)}
                      </p>
                    )}
                  {cancelMutation.isError && cancellingId === reservation.id && (
                    <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {getErrorMessage(cancelMutation.error)}
                    </p>
                  )}
                </Card>
              ))}
            </div>

            <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
          </>
        )}
      </div>
    </>
  )
}
