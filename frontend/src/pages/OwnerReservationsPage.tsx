import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  useCancelReservationAsOwner,
  useConfirmReservation,
  useOwnerReservations,
  useRejectReservation,
} from '@/features/owner/useOwner'
import { getErrorMessage } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import type { ReservationStatusValue } from '@/types/reservation'

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
 * /owner/reservations — every booking request made on any of the
 * current user's properties (GET /owner/reservations, distinct from
 * GET /reservations which is the guest's own bookings). A pending
 * request can be confirmed or rejected (ReservationPolicy: owner or
 * admin only, ReservationService: only from "pending"); a confirmed
 * one can still be cancelled if the owner can no longer host.
 */
export default function OwnerReservationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isLoading, isError, error } = useOwnerReservations(page)
  const confirmMutation = useConfirmReservation()
  const rejectMutation = useRejectReservation()
  const cancelMutation = useCancelReservationAsOwner()

  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  function startCancelling(reservationId: number) {
    setCancellingId(reservationId)
    setCancelReason('')
  }

  function confirmCancel(reservationId: number) {
    cancelMutation.mutate(
      { reservationId, reason: cancelReason || undefined },
      { onSuccess: () => setCancellingId(null) },
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-brand-700">Reservations recues</h1>

      {isLoading && <p className="text-gray-500">Chargement...</p>}

      {isError && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          {getErrorMessage(error)}
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="text-gray-500">Aucune reservation recue pour le moment.</p>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="space-y-4">
            {data.data.map((reservation) => (
              <div key={reservation.id} className="rounded-lg border border-gray-200 p-4 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to={`/properties/${reservation.property.id}`}
                      className="font-medium text-brand-700 transition hover:underline"
                    >
                      {reservation.property.title}
                    </Link>
                    <p className="text-sm text-gray-500">{reservation.guest?.name ?? 'Client'}</p>
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

                {reservation.status === 'pending' && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => confirmMutation.mutate(reservation.id)}
                      disabled={confirmMutation.isPending || rejectMutation.isPending}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition hover:scale-[1.05] hover:bg-brand-700 active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {confirmMutation.isPending && confirmMutation.variables === reservation.id
                        ? 'Confirmation...'
                        : 'Confirmer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectMutation.mutate(reservation.id)}
                      disabled={confirmMutation.isPending || rejectMutation.isPending}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {rejectMutation.isPending && rejectMutation.variables === reservation.id
                        ? 'Refus...'
                        : 'Rejeter'}
                    </button>
                  </div>
                )}

                {reservation.status === 'confirmed' && cancellingId !== reservation.id && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => startCancelling(reservation.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                )}

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
                        disabled={cancelMutation.isPending}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition hover:scale-[1.05] hover:bg-red-700 active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {cancelMutation.isPending ? 'Annulation...' : "Confirmer l'annulation"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancellingId(null)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                      >
                        Retour
                      </button>
                    </div>
                  </div>
                )}

                {confirmMutation.isError && confirmMutation.variables === reservation.id && (
                  <p className="mt-2 text-sm text-red-600">{getErrorMessage(confirmMutation.error)}</p>
                )}
                {rejectMutation.isError && rejectMutation.variables === reservation.id && (
                  <p className="mt-2 text-sm text-red-600">{getErrorMessage(rejectMutation.error)}</p>
                )}
                {cancelMutation.isError && cancellingId === reservation.id && (
                  <p className="mt-2 text-sm text-red-600">{getErrorMessage(cancelMutation.error)}</p>
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
