import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  CalendarX,
  CheckCircle2,
  CreditCard,
  MapPin,
  Star,
  TriangleAlert,
} from 'lucide-react'
import {
  useCancelReservation,
  useMyReservations,
  usePayReservation,
} from '@/features/reservations/useReservations'
import { usePaymentResult } from '@/hooks/usePaymentResult'
import { usePaymentsEnabled } from '@/features/settings/useSettings'
import { getErrorMessage } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import { formatDate } from '@/lib/formatDate'
import ReservationStatusBadge from '@/components/reservations/ReservationStatusBadge'
import { Button, Card, EmptyState, Pagination, Skeleton, Textarea, buttonClasses } from '@/components/ui'
import type { Reservation } from '@/types/reservation'

/**
 * "Mes reservations" - the guest's own bookings (GET /reservations only
 * ever returns the current user's own, see ReservationController::index).
 * Owner-side actions (confirm / reject a request) live on
 * /owner/reservations, not here.
 *
 * Paying leaves the app: the browser goes to the payment provider and
 * comes back to this page with ?payment=... , which usePaymentResult
 * turns into a toast. Whether a booking is settled is read from
 * reservation.is_paid — server truth, because no local state survives
 * that round trip.
 *
 * Phase 28: while Kridar is free there is nothing to pay, so the pay
 * button is not rendered at all. The "Payé" badge on an already-settled
 * booking IS still shown — those payments really happened, and hiding
 * them would make a guest's own history look wrong.
 */
export default function MyReservationsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  usePaymentResult()

  const paymentsEnabled = usePaymentsEnabled()

  const { data, isError, isFetching } = useMyReservations(page)
  const cancelReservation = useCancelReservation()
  const payReservation = usePayReservation()

  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startCancelling(reservationId: number) {
    setCancellingId(reservationId)
    setCancelReason('')
  }

  function confirmCancel(reservationId: number) {
    cancelReservation.mutate(
      { reservationId, reason: cancelReason || undefined },
      { onSuccess: () => setCancellingId(null) },
    )
  }

  function handlePay(reservationId: number) {
    payReservation.mutate(reservationId, {
      // Full navigation, not a router push: the destination is the
      // payment provider, outside this app.
      onSuccess: ({ redirectUrl }) => {
        window.location.href = redirectUrl
      },
    })
  }

  function canCancel(reservation: Reservation) {
    return reservation.status === 'pending' || reservation.status === 'confirmed'
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('reservations.title')}</h1>
      {data && (
        <p className="mt-1 text-sm text-gray-500">
          {t('reservations.count', { n: data.meta.total })}
        </p>
      )}

      <div className="mt-6">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            {t('reservations.loadError')}
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
            title={t('reservations.emptyTitle')}
            description={t('reservations.emptyDescription')}
            action={
              <Link to="/properties" className={buttonClasses()}>
                {t('reservations.browse')}
              </Link>
            }
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
                      <p className="text-sm font-medium text-gray-900">{formatDate(reservation.start_date)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                        {t('reservations.departure')}
                      </p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(reservation.end_date)}</p>
                    </div>
                    <div className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 sm:col-span-1">
                      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                        {t('reservations.total')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatMad(reservation.total_price)}
                      </p>
                    </div>
                  </div>

                  {reservation.cancellation_reason && (
                    <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      {t('reservations.cancellationReason', { reason: reservation.cancellation_reason })}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                    {paymentsEnabled && reservation.status === 'confirmed' && !reservation.is_paid && (
                      <Button
                        size="sm"
                        icon={<CreditCard className="size-4" />}
                        isLoading={payReservation.isPending && payReservation.variables === reservation.id}
                        onClick={() => handlePay(reservation.id)}
                      >
                        {t('reservations.pay', { amount: formatMad(reservation.total_price) })}
                      </Button>
                    )}

                    {reservation.is_paid && (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                        <CheckCircle2 className="size-4" aria-hidden />
                        {t('reservations.paid')}
                      </span>
                    )}

                    {reservation.status === 'completed' && (
                      <Link
                        to={`/reservations/${reservation.id}/review`}
                        className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                      >
                        <Star className="size-4" aria-hidden />
                        {t('reservations.leaveReview')}
                      </Link>
                    )}

                    {canCancel(reservation) && cancellingId !== reservation.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startCancelling(reservation.id)}
                      >
                        {t('reservations.cancel')}
                      </Button>
                    )}
                  </div>

                  {cancellingId === reservation.id && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
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
                          isLoading={cancelReservation.isPending}
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

                  {payReservation.isError && payReservation.variables === reservation.id && (
                    <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {getErrorMessage(payReservation.error)}
                    </p>
                  )}
                  {cancelReservation.isError && cancellingId === reservation.id && (
                    <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {getErrorMessage(cancelReservation.error)}
                    </p>
                  )}
                </Card>
              ))}
            </div>

            <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
          </>
        )}
      </div>
    </main>
  )
}
