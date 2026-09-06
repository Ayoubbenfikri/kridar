import { Link } from 'react-router-dom'
import { useOwnerReservations, useOwnerStats } from '@/features/owner/useOwner'
import { formatMad } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'

/**
 * /owner — the owner dashboard "home": a quick summary that links out
 * to the full lists (/owner/properties, /owner/reservations), same
 * pattern as AccountPage for the guest side.
 *
 * Reachable by anyone logged in, but the backend's 'owner' middleware
 * (EnsureUserOwnsAProperty) 403s if the user owns no property at all —
 * shown here as a plain message rather than a crash.
 */
export default function OwnerDashboardPage() {
  const { data: stats, isLoading: statsLoading, isError: statsIsError, error: statsError } = useOwnerStats()
  const { data: reservationsData } = useOwnerReservations(1)

  if (statsIsError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-brand-700">Espace proprietaire</h1>
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          {getErrorMessage(statsError)}
        </div>
      </main>
    )
  }

  const pendingReservations = (reservationsData?.data ?? [])
    .filter((reservation) => reservation.status === 'pending')
    .slice(0, 3)

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-brand-700">Espace proprietaire</h1>

      {statsLoading && <p className="text-gray-500">Chargement...</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Link
              to="/owner/properties"
              className="rounded-lg border border-gray-200 p-4 transition hover:border-brand-300"
            >
              <p className="text-2xl font-semibold text-brand-700">{stats.properties_count}</p>
              <p className="text-sm text-gray-500">Propriete(s)</p>
            </Link>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-2xl font-semibold text-brand-700">{stats.published_properties_count}</p>
              <p className="text-sm text-gray-500">Publiee(s)</p>
            </div>
            <Link
              to="/owner/reservations"
              className="rounded-lg border border-gray-200 p-4 transition hover:border-brand-300"
            >
              <p className="text-2xl font-semibold text-brand-700">{stats.pending_reservations_count}</p>
              <p className="text-sm text-gray-500">Demande(s) en attente</p>
            </Link>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-2xl font-semibold text-brand-700">{formatMad(stats.total_revenue)}</p>
              <p className="text-sm text-gray-500">Revenu total</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-lg font-medium text-gray-800">{stats.reservations_count}</p>
              <p className="text-sm text-gray-500">Reservation(s) au total</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-lg font-medium text-gray-800">{stats.completed_reservations_count}</p>
              <p className="text-sm text-gray-500">Sejour(s) termine(s)</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-lg font-medium text-gray-800">
                {stats.average_rating !== null ? `${stats.average_rating} / 5` : '-'}
              </p>
              <p className="text-sm text-gray-500">{stats.reviews_count} avis</p>
            </div>
          </div>
        </>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-brand-700">Demandes en attente</h2>
          <Link to="/owner/reservations" className="text-sm text-brand-600 hover:underline">
            Voir tout
          </Link>
        </div>

        {pendingReservations.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune demande en attente pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {pendingReservations.map((reservation) => (
              <Link
                key={reservation.id}
                to="/owner/reservations"
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition hover:border-brand-300"
              >
                <div>
                  <p className="font-medium text-gray-800">{reservation.property.title}</p>
                  <p className="text-sm text-gray-500">
                    {reservation.guest?.name ?? 'Client'} — {reservation.start_date} au {reservation.end_date}
                  </p>
                </div>
                <span className="text-sm text-gray-600">{formatMad(reservation.total_price)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-gray-100 pt-4">
        <Link to="/owner/properties" className="text-sm text-brand-600 hover:underline">
          Gerer mes proprietes →
        </Link>
      </div>
    </main>
  )
}
