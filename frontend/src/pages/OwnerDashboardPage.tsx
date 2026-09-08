import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Inbox,
  Star,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { useOwnerReservations, useOwnerStats } from '@/features/owner/useOwner'
import { formatMad } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'
import { Card, Skeleton } from '@/components/ui'

/**
 * /owner - the owner dashboard "home": a summary that links out to the
 * full lists. Reachable by anyone logged in, but the backend's 'owner'
 * middleware (EnsureUserOwnsAProperty) 403s for a user who owns no
 * property at all - shown here as a plain notice, not a crash.
 */
function Stat({
  icon,
  value,
  label,
  to,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  to?: string
}) {
  const content = (
    <>
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </>
  )

  // Only the stats that lead somewhere are clickable - a card that
  // lifts under the cursor but does nothing is a false promise.
  return to ? (
    <Link
      to={to}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
    >
      {content}
    </Link>
  ) : (
    <Card className="p-4">{content}</Card>
  )
}

export default function OwnerDashboardPage() {
  const { data: stats, isError: statsIsError, error: statsError } = useOwnerStats()
  const { data: reservationsData } = useOwnerReservations(1)

  if (statsIsError) {
    return (
      <>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Espace propriétaire</h1>
        <Card className="mt-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
          {getErrorMessage(statsError)}
        </Card>
      </>
    )
  }

  const pendingReservations = (reservationsData?.data ?? [])
    .filter((reservation) => reservation.status === 'pending')
    .slice(0, 3)

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Espace propriétaire</h1>
      <p className="mt-1 text-sm text-gray-500">Vue d'ensemble de votre activité</p>

      {!stats ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              icon={<Building2 className="size-4.5" />}
              value={stats.properties_count}
              label="Propriétés"
              to="/owner/properties"
            />
            <Stat
              icon={<CheckCircle2 className="size-4.5" />}
              value={stats.published_properties_count}
              label="Publiées"
            />
            <Stat
              icon={<Clock className="size-4.5" />}
              value={stats.pending_reservations_count}
              label="Demandes en attente"
              to="/owner/reservations"
            />
            <Stat
              icon={<Wallet className="size-4.5" />}
              value={formatMad(stats.total_revenue)}
              label="Revenu total"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              icon={<CalendarCheck className="size-4.5" />}
              value={stats.reservations_count}
              label="Réservations au total"
            />
            <Stat
              icon={<CheckCircle2 className="size-4.5" />}
              value={stats.completed_reservations_count}
              label="Séjours terminés"
            />
            <Stat
              icon={<Star className="size-4.5" />}
              value={stats.average_rating !== null ? `${stats.average_rating} / 5` : '—'}
              label={`${stats.reviews_count} avis`}
            />
          </div>
        </>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Demandes en attente</h2>
          <Link
            to="/owner/reservations"
            className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            Voir tout
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {pendingReservations.length === 0 ? (
          <Card className="flex items-center gap-3 p-4 text-sm text-gray-500">
            <Inbox className="size-5 shrink-0 text-gray-400" aria-hidden />
            Aucune demande en attente pour le moment.
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingReservations.map((reservation) => (
              <Link
                key={reservation.id}
                to="/owner/reservations"
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{reservation.property.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {reservation.guest?.name ?? 'Client'} · {reservation.start_date} au{' '}
                    {reservation.end_date}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-gray-900">
                  {formatMad(reservation.total_price)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
