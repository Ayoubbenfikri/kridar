import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCancelReservation, useMyReservations, usePayReservation } from '@/features/reservations/useReservations'
import { getErrorMessage } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import type { Reservation, ReservationStatusValue } from '@/types/reservation'

const STATUS_LABELS: Record<ReservationStatusValue, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  rejected: 'Refusee',
  cancelled: 'Annulee',
  completed: 'Terminee',
}

const STATUS_CLASSES: Record<ReservationStatusValue, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-brand-100 text-brand-700',
}

/**
 * "My reservations" - the guest's own bookings (GET /reservations only
 * ever returns the current user's own, see backend
 * ReservationController::index). Owner-side actions (confirm/reject a
 * request) are NOT here on purpose - that's Phase 20's owner dashboard,
 * which already has GET /owner/reservations built for it.
 */
export default function MyReservationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isLoading, isError } = useMyReservations(page)
  const cancelReservation = useCancelReservation()
  const payReservation = usePayReservation()

  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [justPaidIds, setJustPaidIds] = useState<Set<number>>(new Set())

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
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
      onSuccess: () => setJustPaidIds((ids) => new Set(ids).add(reservationId)),
    })
  }

  function canCancel(reservation: Reservation) {
    return reservation.status === 'pending' || reservation.status === 'confirmed'
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-brand-700">Mes reservations</h1>

      {isLoading && <p className="text-gray-500">Chargement...</p>}

      {isError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          Impossible de charger vos reservations.
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="text-gray-500">
          Vous n'avez pas encore de reservation.{' '}
          <Link to="/properties" className="text-brand-600 hover:underline">
            Parcourir les proprietes
          </Link>
        </p>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="space-y-4">
            {data.data.map((reservation) => (
              <div key={reservation.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to={`/properties/${reservation.property.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {reservation.property.title}
                    </Link>
                    <p className="text-sm text-gray-500">{reservation.property.city}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASSES[reservation.status]}`}
                  >
                    {STATUS_LABELS[reservation.status]}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                  <span>Arrivee : {reservation.start_date}</span>
                  <span>Depart : {reservation.end_date}</span>
                  <span>Total : {formatMad(reservation.total_price)}</span>
                </div>

                {reservation.cancellation_reason && (
                  <p className="mt-2 text-sm text-gray-500">Motif d'annulation : {reservation.cancellation_reason}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {reservation.status === 'confirmed' && !justPaidIds.has(reservation.id) && (
                    <button
                      type="button"
                      onClick={() => handlePay(reservation.id)}
                      disabled={payReservation.isPending}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {payReservation.isPending && payReservation.variables === reservation.id
                        ? 'Paiement...'
                        : 'Payer (simulation CMI)'}
                    </button>
                  )}

                  {justPaidIds.has(reservation.id) && (
                    <span className="text-sm font-medium text-green-700">Paye ✓</span>
                  )}

                  {reservation.status === 'completed' && (
                    <Link
                      to={`/reservations/${reservation.id}/review`}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Laisser un avis
                    </Link>
                  )}

                  {canCancel(reservation) && cancellingId !== reservation.id && (
                    <button
                      type="button"
                      onClick={() => startCancelling(reservation.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                {cancellingId === reservation.id && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3">
                    <label htmlFor={`reason-${reservation.id}`} className="mb-1 block text-sm font-medium text-gray-700">
                      Motif (optionnel)
                    </label>
                    <textarea
                      id={`reason-${reservation.id}`}
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirmCancel(reservation.id)}
                        disabled={cancelReservation.isPending}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelReservation.isPending ? 'Annulation...' : "Confirmer l'annulation"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancellingId(null)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Retour
                      </button>
                    </div>
                  </div>
                )}

                {payReservation.isError && payReservation.variables === reservation.id && (
                  <p className="mt-2 text-sm text-red-600">{getErrorMessage(payReservation.error)}</p>
                )}
                {cancelReservation.isError && cancellingId === reservation.id && (
                  <p className="mt-2 text-sm text-red-600">{getErrorMessage(cancelReservation.error)}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Precedent
            </button>
            <span className="text-sm text-gray-500">
              Page {data.meta.current_page} / {data.meta.last_page}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= data.meta.last_page}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </main>
  )
}
