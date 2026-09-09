import { Link } from 'react-router-dom'
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Star,
  TriangleAlert,
  UserCheck,
  UserX,
  Users,
  Wallet,
} from 'lucide-react'
import { useAdminStats } from '@/features/admin/useAdmin'
import { formatMad } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'
import { Card, Skeleton } from '@/components/ui'

/**
 * /admin - platform-wide figures. Every value comes straight from
 * AdminService::getStats(); nothing is computed here.
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

export default function AdminDashboardPage() {
  const { data: stats, isError, error } = useAdminStats()

  if (isError) {
    return (
      <>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Administration</h1>
        <Card className="mt-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
          {getErrorMessage(error)}
        </Card>
      </>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Administration</h1>
      <p className="mt-1 text-sm text-gray-500">Vue d'ensemble de la plateforme</p>

      {!stats ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <h2 className="mt-8 mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Utilisateurs
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              icon={<Users className="size-4.5" />}
              value={stats.users_count}
              label="Comptes au total"
              to="/admin/users"
            />
            <Stat
              icon={<UserCheck className="size-4.5" />}
              value={stats.active_users_count}
              label="Actifs"
            />
            <Stat
              icon={<UserX className="size-4.5" />}
              value={stats.suspended_users_count}
              label="Suspendus"
            />
            <Stat
              icon={<Building2 className="size-4.5" />}
              value={stats.owners_count}
              label="Propriétaires"
            />
          </div>

          <h2 className="mt-8 mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Activité
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              icon={<Building2 className="size-4.5" />}
              value={stats.properties_count}
              label="Propriétés"
              to="/admin/properties"
            />
            <Stat
              icon={<CheckCircle2 className="size-4.5" />}
              value={stats.published_properties_count}
              label="Publiées"
            />
            <Stat
              icon={<CalendarCheck className="size-4.5" />}
              value={stats.reservations_count}
              label="Réservations"
            />
            <Stat
              icon={<CheckCircle2 className="size-4.5" />}
              value={stats.completed_reservations_count}
              label="Séjours terminés"
            />
          </div>

          <h2 className="mt-8 mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Revenus et avis
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              icon={<Wallet className="size-4.5" />}
              value={formatMad(stats.total_revenue)}
              label="Revenu total encaissé"
            />
            <Stat
              icon={<Star className="size-4.5" />}
              value={stats.average_rating !== null ? `${stats.average_rating} / 5` : '—'}
              label="Note moyenne"
            />
            <Stat
              icon={<Star className="size-4.5" />}
              value={stats.reviews_count}
              label="Avis publiés"
            />
          </div>
        </>
      )}
    </>
  )
}
