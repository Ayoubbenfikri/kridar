import { useMemo, useState } from 'react'
import { useAvailability } from '@/features/reservations/useReservations'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

// How far ahead the calendar lets guests browse/book. One availability
// fetch covers this whole window (see useAvailability) so navigating
// between months inside it doesn't trigger new requests.
const MONTHS_AHEAD = 6

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIsoDateLocal(iso: string): Date {
  // Appending a local time (instead of parsing "2026-09-06" directly,
  // which JS treats as UTC midnight) avoids off-by-one-day bugs for
  // users west of UTC.
  return new Date(`${iso}T00:00:00`)
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + months)
  return copy
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Every ISO date in [startIso, endIso) - endIso itself is excluded (it's a checkout day, not an occupied night). */
function expandRangeToDates(startIso: string, endIso: string): string[] {
  const dates: string[] = []
  let cursor = parseIsoDateLocal(startIso)
  const end = parseIsoDateLocal(endIso)
  while (cursor < end) {
    dates.push(toIsoDate(cursor))
    cursor = addDays(cursor, 1)
  }
  return dates
}

/** Calendar grid for one month: null cells pad the start so the 1st lands on its real weekday (Monday-first). */
function buildMonthGrid(monthStart: Date): Array<Date | null> {
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (monthStart.getDay() + 6) % 7 // JS: 0=Sun..6=Sat -> 0=Mon..6=Sun

  const cells: Array<Date | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  return cells
}

interface AvailabilityCalendarProps {
  propertyId: number
  startDate: string | null
  endDate: string | null
  onChange: (startDate: string | null, endDate: string | null) => void
}

/**
 * A single-month calendar with previous/next navigation across a
 * MONTHS_AHEAD-month window. Click a day to pick the check-in date,
 * click a later day to pick check-out - clicking a day that isn't
 * actually free in between restarts the selection from that day
 * instead of showing an error, which keeps the interaction forgiving.
 *
 * Home-made on purpose (no date-picker library) - simple and fully
 * under our control, see the Phase 18 plan.
 */
export default function AvailabilityCalendar({
  propertyId,
  startDate,
  endDate,
  onChange,
}: AvailabilityCalendarProps) {
  const today = useMemo(() => startOfToday(), [])
  const windowStart = today
  const windowEnd = useMemo(() => addMonths(today, MONTHS_AHEAD), [today])

  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(today))

  const { data: availability, isLoading, isError } = useAvailability(
    propertyId,
    toIsoDate(windowStart),
    toIsoDate(windowEnd),
  )

  const unavailableDates = useMemo(() => {
    const set = new Set<string>()
    if (!availability) return set
    for (const range of [...availability.reservations, ...availability.blocked]) {
      for (const date of expandRangeToDates(range.start_date, range.end_date)) {
        set.add(date)
      }
    }
    return set
  }, [availability])

  function handleDayClick(iso: string) {
    if (!startDate || endDate) {
      onChange(iso, null)
      return
    }

    if (iso <= startDate) {
      onChange(iso, null)
      return
    }

    const nightsInBetween = expandRangeToDates(startDate, iso)
    const hasConflict = nightsInBetween.some((date) => unavailableDates.has(date))
    onChange(hasConflict ? iso : startDate, hasConflict ? null : iso)
  }

  const canGoPrev = viewedMonth.getTime() > startOfMonth(today).getTime()
  const canGoNext = viewedMonth.getTime() < startOfMonth(windowEnd).getTime()

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewedMonth((month) => addMonths(month, -1))}
          disabled={!canGoPrev}
          className="rounded px-2 py-1 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Mois precedent"
        >
          ←
        </button>
        <span className="font-medium text-gray-800">
          {MONTH_LABELS[viewedMonth.getMonth()]} {viewedMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setViewedMonth((month) => addMonths(month, 1))}
          disabled={!canGoNext}
          className="rounded px-2 py-1 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Mois suivant"
        >
          →
        </button>
      </div>

      {isLoading && <p className="py-6 text-center text-sm text-gray-500">Chargement du calendrier...</p>}
      {isError && (
        <p className="py-6 text-center text-sm text-red-600">Impossible de charger les disponibilites.</p>
      )}

      {availability && (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {buildMonthGrid(viewedMonth).map((date, index) => {
              if (!date) return <span key={`empty-${index}`} />

              const iso = toIsoDate(date)
              const isPast = date < today
              const isUnavailable = unavailableDates.has(iso)
              const isDisabled = isPast || isUnavailable
              const isStart = iso === startDate
              const isEnd = iso === endDate
              const isInRange = Boolean(startDate && endDate && iso > startDate && iso < endDate)

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDayClick(iso)}
                  className={`aspect-square rounded text-sm transition ${
                    isDisabled
                      ? 'cursor-not-allowed text-gray-300 line-through'
                      : isStart || isEnd
                        ? 'bg-brand-600 font-semibold text-white'
                        : isInRange
                          ? 'bg-brand-100 text-brand-700'
                          : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Cliquez une date d'arrivee, puis une date de depart. Les dates grisees sont deja reservees.
      </p>
    </div>
  )
}
