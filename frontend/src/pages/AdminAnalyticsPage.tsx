import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Eye,
  FileDown,
  Footprints,
  MessageSquare,
  MousePointerClick,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { useAdminAnalytics } from '@/features/admin/useAdmin'
import { getErrorMessage } from '@/lib/apiErrors'
import { cn } from '@/lib/cn'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui'
import type { AnalyticsDay, AnalyticsRange, AnalyticsReport, AnalyticsTopListing } from '@/types/analytics'

/**
 * /admin/analytics (Phase A4) - who visits Krihouse and what they do.
 *
 * Every number comes straight from GET /admin/analytics
 * (AnalyticsReportService); this page only formats and draws them. In
 * French, like the rest of the admin.
 *
 * No chart library: the per-day chart is plain divs (one bar per day,
 * single colour, a tooltip on hover) and the breakdowns are horizontal
 * bars - enough for one series, and nothing new to install.
 *
 * PDF export: the browser's own print dialog ("Enregistrer en PDF").
 * The app menus carry print:hidden, the report gets a print-only header,
 * cards avoid being cut between two pages, and print-color-adjust keeps
 * the bars' colours (browsers drop backgrounds when printing otherwise).
 * No PDF library, and the text stays real text in the file.
 */

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
]

const ACTION_LABELS: Record<AnalyticsReport['actions'][number]['name'], string> = {
  listing_view: 'Annonce consultée',
  roommate_view: 'Colocation consultée',
  search: 'Recherche lancée',
  contact_click: 'Message envoyé au propriétaire',
  phone_reveal_click: 'Clic « voir le numéro »',
  booking_request: 'Demande de réservation',
  favorite_add: 'Ajout aux favoris',
  share_click: 'Annonce partagée en message',
  register: 'Inscription',
  google_login_click: 'Clic « Continuer avec Google »',
  support_click: 'Clic sur un don',
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Mobile',
  tablet: 'Tablette',
  desktop: 'Ordinateur',
}

const LOCALE_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  ary: 'Darija',
}

const numberFormat = new Intl.NumberFormat('fr-FR')
const formatNumber = (value: number) => numberFormat.format(value)

/** "2026-10-10" -> "10 oct." - parsed as a local date, never shifted by a timezone. */
function formatDay(date: string, withYear = false): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

function formatRate(rate: number | null): string {
  return rate === null ? '—' : `${rate.toLocaleString('fr-FR')} %`
}

function Tile({
  icon,
  value,
  label,
  hint,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  hint?: string
}) {
  return (
    <Card className="break-inside-avoid p-4">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 tabular-nums">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </Card>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">{children}</h2>
}

/**
 * Visitors per day: one bar per day, the tallest day at full height.
 * Hover (or focus with the keyboard) shows that day's exact figures.
 */
function DailyChart({ days }: { days: AnalyticsDay[] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...days.map((day) => day.visitors))
  const activeDay = active !== null ? days[active] : null

  // A label under the first, middle and last bar is enough to read the
  // period; one under every bar would collide at 90 days.
  const labelled = new Set([0, Math.floor((days.length - 1) / 2), days.length - 1])

  return (
    <Card className="break-inside-avoid p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-gray-900">Visiteurs par jour</h3>
        <p className="text-xs text-gray-500 tabular-nums">
          {activeDay
            ? `${formatDay(activeDay.date, true)} · ${formatNumber(activeDay.visitors)} visiteur(s) · ${formatNumber(activeDay.page_views)} page(s) vue(s)`
            : `Maximum : ${formatNumber(max)} / jour`}
        </p>
      </div>

      {/* The bars. aria-hidden: the same figures are in the table below
          for screen readers. */}
      <div
        className="mt-4 flex h-44 items-end gap-0.5 border-b border-gray-200"
        aria-hidden
        onMouseLeave={() => setActive(null)}
      >
        {days.map((day, index) => (
          <div
            key={day.date}
            className="flex h-full flex-1 cursor-default items-end"
            onMouseEnter={() => setActive(index)}
          >
            <div
              className={cn(
                'w-full rounded-t-[4px] transition-colors',
                active === index ? 'bg-brand-700' : 'bg-brand-600',
              )}
              // At least 2px so a day with visitors never looks empty.
              style={{ height: day.visitors === 0 ? 0 : `max(2px, ${(day.visitors / max) * 100}%)` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex gap-0.5 text-[11px] text-gray-400" aria-hidden>
        {days.map((day, index) => (
          <div key={day.date} className="relative flex-1">
            {labelled.has(index) && (
              <span
                className={cn(
                  'absolute top-0 whitespace-nowrap',
                  index === 0 ? 'start-0' : index === days.length - 1 ? 'end-0' : 'start-1/2 -translate-x-1/2',
                )}
              >
                {formatDay(day.date)}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="h-4" />

      <table className="sr-only">
        <caption>Visiteurs et pages vues par jour</caption>
        <thead>
          <tr>
            <th scope="col">Jour</th>
            <th scope="col">Visiteurs</th>
            <th scope="col">Pages vues</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <td>{formatDay(day.date, true)}</td>
              <td>{day.visitors}</td>
              <td>{day.page_views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

/** A ranked list with a proportional bar behind each value. */
function BarList({
  title,
  rows,
  unit,
  empty = 'Pas encore de données.',
}: {
  title: string
  rows: { label: string; value: number }[]
  unit: string
  empty?: string
}) {
  const max = Math.max(1, ...rows.map((row) => row.value))

  return (
    <Card className="break-inside-avoid p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <li key={row.label} className="relative flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm">
              <span
                className="absolute inset-y-0 start-0 rounded-md bg-brand-50"
                style={{ width: `${(row.value / max) * 100}%` }}
                aria-hidden
              />
              <span className="relative min-w-0 truncate text-gray-700">{row.label}</span>
              <span className="relative shrink-0 font-semibold text-gray-900 tabular-nums">{formatNumber(row.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function ListingTable({
  title,
  rows,
  linkPrefix,
}: {
  title: string
  rows: AnalyticsTopListing[]
  linkPrefix: string
}) {
  return (
    <Card className="break-inside-avoid overflow-hidden">
      <h3 className="px-4 pt-4 text-sm font-semibold text-gray-900 sm:px-5">{title}</h3>
      {rows.length === 0 ? (
        <p className="px-4 pt-3 pb-4 text-sm text-gray-500 sm:px-5">Aucune annonce consultée sur cette période.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-gray-100 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-2 text-start font-medium sm:px-5">Annonce</th>
                <th scope="col" className="px-3 py-2 text-end font-medium">Vues</th>
                <th scope="col" className="px-3 py-2 text-end font-medium">Visiteurs</th>
                <th scope="col" className="px-4 py-2 text-end font-medium sm:px-5">Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="max-w-[16rem] px-4 py-2.5 sm:px-5">
                    {row.title ? (
                      <Link to={`${linkPrefix}${row.id}`} className="block truncate font-medium text-gray-900 hover:text-brand-600">
                        {row.title}
                      </Link>
                    ) : (
                      <span className="text-gray-400 italic">Annonce supprimée (#{row.id})</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-end tabular-nums">{formatNumber(row.views)}</td>
                  <td className="px-3 py-2.5 text-end tabular-nums text-gray-500">{formatNumber(row.visitors)}</td>
                  <td className="px-4 py-2.5 text-end tabular-nums sm:px-5">{formatNumber(row.contacts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('30d')
  const { data: report, isError, error, isFetching } = useAdminAnalytics(range)

  /**
   * Opens the browser's print dialog, where the admin picks "Enregistrer
   * en PDF". The page title becomes the suggested file name for the PDF
   * (krihouse-audience-30j-2026-10-10.pdf), then goes back to normal.
   */
  function handleExport() {
    if (!report) return

    const previousTitle = document.title
    document.title = `krihouse-audience-${report.range.replace('d', 'j')}-${report.to}`
    window.addEventListener('afterprint', () => (document.title = previousTitle), { once: true })
    window.print()
  }

  return (
    // print-color-adjust: inherited by every child, so the bars and the
    // light bar-list backgrounds stay in the PDF.
    <div className="[print-color-adjust:exact]">
      {/* Print-only header: on paper there is no menu around the report
          to say what it is and when it was made. */}
      {report && (
        <div className="mb-4 hidden border-b border-gray-200 pb-3 print:block">
          <p className="text-lg font-bold text-gray-900">Krihouse — Rapport d'audience</p>
          <p className="text-sm text-gray-600">
            Du {formatDay(report.from, true)} au {formatDay(report.to, true)} ·{' '}
            {RANGES.find((option) => option.value === report.range)?.label}
          </p>
          <p className="text-xs text-gray-400">
            Généré le{' '}
            {new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })} · mesure anonyme,
            sans cookie
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Audience</h1>
          <p className="mt-1 text-sm text-gray-500">
            Mesure anonyme, sans cookie
            {report && ` · du ${formatDay(report.from, true)} au ${formatDay(report.to, true)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-1" role="group" aria-label="Période">
            {RANGES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                aria-pressed={range === option.value}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition',
                  range === option.value ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<FileDown className="size-4" />}
            onClick={handleExport}
            disabled={!report || isFetching}
          >
            Exporter en PDF
          </Button>
        </div>
      </div>

      {isError ? (
        <Card className="mt-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
          {getErrorMessage(error)}
        </Card>
      ) : !report ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
          <Skeleton className="col-span-2 h-64 w-full rounded-xl sm:col-span-4" />
        </div>
      ) : report.totals.page_views === 0 && report.actions.every((action) => action.total === 0) ? (
        <EmptyState
          icon={<BarChart3 className="size-6" />}
          title="Aucune visite sur cette période"
          description="Les chiffres apparaîtront ici dès que des visiteurs navigueront sur Krihouse. Vos propres visites en tant qu'admin ne sont pas comptées."
        />
      ) : (
        // Dimmed while another period loads: the old figures stay on
        // screen (keepPreviousData) instead of flashing to skeletons.
        <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
          <SectionTitle>Vue d'ensemble</SectionTitle>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile
              icon={<Users className="size-4.5" />}
              value={formatNumber(report.totals.visitors)}
              label="Visiteurs"
              hint={`Aujourd'hui : ${formatNumber(report.totals.today_visitors)}`}
            />
            <Tile
              icon={<Footprints className="size-4.5" />}
              value={formatNumber(report.totals.visits)}
              label="Visites"
              hint="Arrivées sur le site"
            />
            <Tile
              icon={<Eye className="size-4.5" />}
              value={formatNumber(report.totals.page_views)}
              label="Pages vues"
              hint={`Aujourd'hui : ${formatNumber(report.totals.today_page_views)}`}
            />
            <Tile
              icon={<BarChart3 className="size-4.5" />}
              value={formatNumber(report.totals.listing_views)}
              label="Annonces consultées"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Tile
              icon={<MessageSquare className="size-4.5" />}
              value={formatRate(report.conversion.contact_rate)}
              label="Taux de contact"
              hint="Messages envoyés pour 100 annonces consultées"
            />
            <Tile
              icon={<MousePointerClick className="size-4.5" />}
              value={formatRate(report.conversion.booking_rate)}
              label="Taux de réservation"
              hint="Demandes de réservation pour 100 annonces consultées"
            />
          </div>

          <SectionTitle>Fréquentation</SectionTitle>
          <DailyChart days={report.daily} />
          <p className="mt-2 text-xs text-gray-400">
            Sans cookie, un même visiteur venu deux jours différents compte deux fois : « visiteurs » = visiteurs uniques
            par jour, additionnés.
          </p>

          <SectionTitle>Contenu</SectionTitle>
          {/* One table per row: side by side, the four columns no
              longer fit next to the admin menu. */}
          <div className="grid grid-cols-1 gap-4">
            <ListingTable title="Annonces les plus consultées" rows={report.top_properties} linkPrefix="/properties/" />
            <ListingTable title="Colocations les plus consultées" rows={report.top_roommate_listings} linkPrefix="/roommates/" />
          </div>
          <div className="mt-4">
            <BarList
              title="Pages les plus vues"
              unit="pages vues"
              rows={report.top_pages.map((page) => ({ label: page.path, value: page.views }))}
            />
          </div>

          <SectionTitle>Visiteurs</SectionTitle>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BarList
              title="D'où ils viennent"
              unit="visites"
              rows={report.sources.map((source) => ({
                label: source.source === 'direct' ? 'Direct (lien tapé, favori, appli)' : source.source,
                value: source.visits,
              }))}
            />
            <BarList
              title="Appareils"
              unit="visiteurs"
              rows={report.devices.map((device) => ({ label: DEVICE_LABELS[device.value] ?? device.value, value: device.visitors }))}
            />
            <BarList
              title="Langue"
              unit="visiteurs"
              rows={report.locales.map((locale) => ({ label: LOCALE_LABELS[locale.value] ?? locale.value, value: locale.visitors }))}
            />
          </div>

          <SectionTitle>Actions</SectionTitle>
          <BarList
            title="Ce que font les visiteurs"
            unit="fois"
            rows={report.actions.map((action) => ({ label: ACTION_LABELS[action.name] ?? action.name, value: action.total }))}
          />
        </div>
      )}
    </div>
  )
}
