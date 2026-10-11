import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Clock,
  FilePen,
  Inbox,
  Plus,
  Star,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { useOwnerReservations, useOwnerStats } from '@/features/owner/useOwner'
import { formatMad } from '@/lib/formatPrice'
import { formatDate } from '@/lib/formatDate'
import { getErrorMessage } from '@/lib/apiErrors'
import { Card, Skeleton, buttonClasses } from '@/components/ui'
import { OWNER_START_PATH } from '@/lib/safeRedirect'

/**
 * /owner - the owner dashboard "home": a summary that links out to the
 * full lists. Reachable by anyone logged in, but the backend's 'owner'
 * middleware (EnsureUserOwnsAProperty) 403s for a user who owns no
 * property at all.
 *
 * Phase O1 (owner UX): that 403 is exactly what a brand-new owner coming
 * from an ad hits first, so it is shown as a welcome screen with one big
 * "publish" button - not as a red English error. Any OTHER error still
 * shows the notice.
 */
function Stat({
  icon,
  value,
  label,
  to,
  hint,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  to?: string
  hint?: string
}) {
  const content = (
    <>
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
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

function OwnerWelcome() {
  const { t } = useTranslation()
  const steps = [
    { icon: <FilePen className="size-4.5" />, text: t('owner.welcome.step1') },
    { icon: <Camera className="size-4.5" />, text: t('owner.welcome.step2') },
    { icon: <CheckCircle2 className="size-4.5" />, text: t('owner.welcome.step3') },
  ]

  return (
    <Card className="p-6 text-center sm:p-8">
      <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Building2 className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">{t('owner.welcome.title')}</h1>
      <p className="mx-auto mt-2 max-w-md text-gray-500">{t('owner.welcome.text')}</p>

      <ol className="mx-auto mt-6 max-w-sm space-y-3 text-start">
        {steps.map((step, index) => (
          <li key={index} className="flex items-center gap-3 text-sm text-gray-700">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              {step.icon}
            </span>
            {step.text}
          </li>
        ))}
      </ol>

      <Link to={OWNER_START_PATH} className={buttonClasses({ className: 'mt-8 h-12 w-full px-6 text-base sm:w-auto' })}>
        <Plus className="size-5" aria-hidden />
        {t('owner.welcome.cta')}
      </Link>
      <p className="mt-3 text-xs text-gray-400">{t('owner.welcome.free')}</p>
    </Card>
  )
}

export default function OwnerDashboardPage() {
  const { t } = useTranslation()
  const { data: stats, isError: statsIsError, error: statsError } = useOwnerStats()
  const { data: reservationsData } = useOwnerReservations(1)

  // 403 = "owns no property yet" (EnsureUserOwnsAProperty).
  if (statsIsError && isAxiosError(statsError) && statsError.response?.status === 403) {
    return <OwnerWelcome />
  }

  if (statsIsError) {
    return (
      <>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('owner.dashboard.title')}</h1>
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
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('owner.dashboard.title')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('owner.dashboard.subtitle')}</p>

      {!stats ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Phase O1: a listing left as a draft is invisible to every
              visitor - the most common reason an owner "published" and got
              nothing. Said plainly, with the way out. */}
          {stats.properties_count > stats.published_properties_count && (
            <Link
              to="/owner/properties"
              className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 transition hover:border-amber-300"
            >
              <TriangleAlert className="size-5 shrink-0 text-amber-600" aria-hidden />
              <span className="min-w-0 flex-1">
                {t('owner.dashboard.draftsWarning', {
                  n: stats.properties_count - stats.published_properties_count,
                })}
              </span>
              <ArrowRight className="size-4 shrink-0 rtl:rotate-180" aria-hidden />
            </Link>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              icon={<Building2 className="size-4.5" />}
              value={stats.properties_count}
              label={t('owner.dashboard.properties')}
              to="/owner/properties"
            />
            <Stat
              icon={<CheckCircle2 className="size-4.5" />}
              value={stats.published_properties_count}
              label={t('owner.dashboard.published')}
            />
            <Stat
              icon={<Clock className="size-4.5" />}
              value={stats.pending_reservations_count}
              label={t('owner.dashboard.pendingRequests')}
              to="/owner/reservations"
            />
            {/* What the owner RECEIVES, commission already deducted.
                The hint makes the deduction visible rather than leaving
                the owner to wonder why the number looks small. */}
            <Stat
              icon={<Wallet className="size-4.5" />}
              value={formatMad(stats.total_revenue)}
              label={t('owner.dashboard.netRevenue')}
              hint={
                stats.total_commission > 0
                  ? t('owner.dashboard.afterCommission', { amount: formatMad(stats.total_commission) })
                  : t('owner.dashboard.noCommission')
              }
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              icon={<CalendarCheck className="size-4.5" />}
              value={stats.reservations_count}
              label={t('owner.dashboard.totalReservations')}
            />
            <Stat
              icon={<CheckCircle2 className="size-4.5" />}
              value={stats.completed_reservations_count}
              label={t('owner.dashboard.completedStays')}
            />
            <Stat
              icon={<Star className="size-4.5" />}
              value={stats.average_rating !== null ? `${stats.average_rating} / 5` : '—'}
              label={t('owner.dashboard.reviews', { n: stats.reviews_count })}
            />
          </div>
        </>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">{t('owner.dashboard.pendingTitle')}</h2>
          <Link
            to="/owner/reservations"
            className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            {t('common.seeAll')}
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {pendingReservations.length === 0 ? (
          <Card className="flex items-center gap-3 p-4 text-sm text-gray-500">
            <Inbox className="size-5 shrink-0 text-gray-400" aria-hidden />
            {t('owner.dashboard.noPending')}
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
                    {reservation.guest?.name ?? t('owner.dashboard.guestFallback')} ·{' '}
                    {t('owner.dashboard.dateRange', {
                      start: formatDate(reservation.start_date),
                      end: formatDate(reservation.end_date),
                    })}
                  </p>
                </div>
                {/* The owner's own figure, not the guest's total. */}
                <span className="shrink-0 font-semibold text-gray-900">
                  {formatMad(reservation.owner_amount)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
