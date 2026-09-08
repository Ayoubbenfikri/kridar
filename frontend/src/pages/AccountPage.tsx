import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CalendarCheck, Heart, Inbox, Settings } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useMyReservations } from '@/features/reservations/useReservations'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useUnreadCount } from '@/features/notifications/useNotifications'
import { formatMad } from '@/lib/formatPrice'
import { Card, buttonClasses } from '@/components/ui'
import ReservationStatusBadge from '@/components/reservations/ReservationStatusBadge'
import type { ReservationStatusValue } from '@/types/reservation'

const UPCOMING_STATUSES: ReadonlySet<ReservationStatusValue> = new Set(['pending', 'confirmed'])

/**
 * /account - the account "home": a summary that links out to the pages
 * that already exist (reservations, favorites, notifications) rather
 * than duplicating their logic here.
 */
function StatLink({
  to,
  icon,
  value,
  label,
}: {
  to: string
  icon: React.ReactNode
  value: React.ReactNode
  label: string
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </Link>
  )
}

export default function AccountPage() {
  const { user } = useAuth()
  const { data: reservationsData } = useMyReservations(1)
  const { data: favoritesData } = useFavorites(1)
  const unreadCount = useUnreadCount(true)

  const upcomingReservations = (reservationsData?.data ?? [])
    .filter((reservation) => UPCOMING_STATUSES.has(reservation.status))
    .slice(0, 3)

  const initials = (user?.name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {initials}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bonjour {user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <Link to="/account/settings" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
          <Settings className="size-4" aria-hidden />
          Paramètres
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatLink
          to="/reservations"
          icon={<CalendarCheck className="size-4.5" />}
          value={reservationsData?.meta.total ?? 0}
          label="Réservations"
        />
        <StatLink
          to="/favorites"
          icon={<Heart className="size-4.5" />}
          value={favoritesData?.meta.total ?? 0}
          label="Favoris"
        />
        <StatLink
          to="/notifications"
          icon={<Bell className="size-4.5" />}
          value={unreadCount}
          label="Notifications non lues"
        />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Prochaines réservations</h2>
          <Link
            to="/reservations"
            className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            Voir tout
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {upcomingReservations.length === 0 ? (
          <Card className="flex items-center gap-3 p-4 text-sm text-gray-500">
            <Inbox className="size-5 shrink-0 text-gray-400" aria-hidden />
            Aucune réservation en attente ou confirmée pour le moment.
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingReservations.map((reservation) => (
              <Link
                key={reservation.id}
                to="/reservations"
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{reservation.property.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {reservation.start_date} au {reservation.end_date}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <ReservationStatusBadge status={reservation.status} />
                  <span className="font-semibold text-gray-900">
                    {formatMad(reservation.total_price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
