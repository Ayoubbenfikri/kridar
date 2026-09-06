import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { useMyReservations } from '@/features/reservations/useReservations'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useUnreadCount } from '@/features/notifications/useNotifications'
import { formatMad } from '@/lib/formatPrice'
import type { ReservationStatusValue } from '@/types/reservation'

const UPCOMING_STATUSES: ReadonlySet<ReservationStatusValue> = new Set(['pending', 'confirmed'])

/**
 * Phase 19 - the account "home" page (/account): a quick summary that
 * links out to the pages that already exist (favorites, reservations,
 * notifications) rather than duplicating their logic here.
 */
export default function AccountPage() {
  const { user } = useAuth()
  const { data: reservationsData } = useMyReservations(1)
  const { data: favoritesData } = useFavorites(1)
  const unreadCount = useUnreadCount(true)

  const upcomingReservations = (reservationsData?.data ?? [])
    .filter((reservation) => UPCOMING_STATUSES.has(reservation.status))
    .slice(0, 3)

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-brand-700">Bonjour {user?.name}</h1>
      <p className="mb-6 text-gray-500">{user?.email}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/reservations"
          className="rounded-xl border border-brand-100 p-4 shadow-lg shadow-brand-900/10 transition hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-900/25"
        >
          <p className="text-2xl font-semibold text-brand-700">{reservationsData?.meta.total ?? 0}</p>
          <p className="text-sm text-gray-500">Reservation(s)</p>
        </Link>
        <Link
          to="/favorites"
          className="rounded-xl border border-brand-100 p-4 shadow-lg shadow-brand-900/10 transition hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-900/25"
        >
          <p className="text-2xl font-semibold text-brand-700">{favoritesData?.meta.total ?? 0}</p>
          <p className="text-sm text-gray-500">Favori(s)</p>
        </Link>
        <Link
          to="/notifications"
          className="rounded-xl border border-brand-100 p-4 shadow-lg shadow-brand-900/10 transition hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-900/25"
        >
          <p className="text-2xl font-semibold text-brand-700">{unreadCount}</p>
          <p className="text-sm text-gray-500">Notification(s) non lue(s)</p>
        </Link>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-brand-700">Prochaines reservations</h2>
          <Link to="/reservations" className="text-sm text-brand-600 transition hover:underline">
            Voir tout
          </Link>
        </div>

        {upcomingReservations.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune reservation en attente ou confirmee pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {upcomingReservations.map((reservation) => (
              <Link
                key={reservation.id}
                to="/reservations"
                className="flex items-center justify-between rounded-xl border border-brand-100 px-4 py-3 shadow-lg shadow-brand-900/10 transition hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-900/25"
              >
                <div>
                  <p className="font-medium text-gray-800">{reservation.property.title}</p>
                  <p className="text-sm text-gray-500">
                    {reservation.start_date} - {reservation.end_date}
                  </p>
                </div>
                <span className="text-sm text-gray-600">{formatMad(reservation.total_price)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-gray-100 pt-4">
        <Link to="/account/settings" className="text-sm text-brand-600 transition hover:underline">
          Parametres du compte →
        </Link>
      </div>
    </main>
  )
}
