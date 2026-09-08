import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, CalendarX, Check, MapPin, TriangleAlert, User, X } from 'lucide-react'
import {
  useCancelReservationAsOwner,
  useConfirmReservation,
  useOwnerReservations,
  useRejectReservation,
} from '@/features/owner/useOwner'
import { getErrorMessage } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import ReservationStatusBadge from '@/components/reservations/ReservationStatusBadge'
import { Button, Card, EmptyState, Pagination, Skeleton, Textarea } from '@/components/ui'

/**
 * /owner/reservations - the requests received on the current user's
 * properties. Confirm / reject apply to a pending request; cancelling a
 * confirmed one asks for an optional reason, exactly as the guest side
 * does. Every action goes through the same endpoints as before, with
 * ReservationPolicy checking ownership server-side.
 */
export default function OwnerReservationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isError, error, isFetching } = useOwnerReservations(page)
  const confirmMutation = useConfirmReservation()
  const rejectMutation = useRejectReservation()
  const cancelMutation = useCancelReservationAsOwner()

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
    cancelMutation.mutate(
      { reservationId, reason: cancelReason || undefined },
      { onSuccess: () => setCancellingId(null) },
    )
  }

  const isDeciding = confirmMutation.isPending || rejectMutation.isPending

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Réservations reçues</h1>
      {data && (
        <p className="mt-1 text-sm text-gray-500">
          {data.meta.total} demande{data.meta.total > 1 ? 's' : ''}
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
            title="Aucune réservation reçue"
            description="Les demandes de vos voyageurs apparaîtront ici dès qu'une réservation sera envoyée."
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
                        {reservation.guest?.name ?? 'Client'}
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
                        Arrivée
                      </p>
                      <p className="text-sm font-medium text-gray-900">{reservation.start_date}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                        Départ
                      </p>
                      <p className="text-sm font-medium text-gray-900">{reservation.end_date}</p>
                    </div>
                    <div className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 sm:col-span-1">
                      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                        Total
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatMad(reservation.total_price)}
                      </p>
                    </div>
                  </div>

                  {reservation.cancellation_reason && (
                    <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      Motif d'annulation : {reservation.cancellation_reason}
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
                            onClick={() => confirmMutation.mutate(reservation.id)}
                          >
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<X className="size-4" />}
                            disabled={isDeciding}
                            isLoading={
                              rejectMutation.isPending && rejectMutation.variables === reservation.id
                            }
                            onClick={() => rejectMutation.mutate(reservation.id)}
                          >
                            Refuser
                          </Button>
                        </>
                      )}

                      {reservation.status === 'confirmed' && (
                        <Button size="sm" variant="ghost" onClick={() => startCancelling(reservation.id)}>
                          Annuler la réservation
                        </Button>
                      )}
                    </div>
                  )}

                  {cancellingId === reservation.id && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <Textarea
                        label="Motif de l'annulation (optionnel)"
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
                          Confirmer l'annulation
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setCancellingId(null)}>
                          Retour
                        </Button>
                      </div>
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
