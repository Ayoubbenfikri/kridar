import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { PriceHistogram } from '@/types/property'

/**
 * Price range: a bar chart of how many listings sit in each price band,
 * a two-handle slider under it, and two Min / Max boxes - the same idea as
 * the price filter on Airbnb.
 *
 * The value is two STRINGS (min, max), the same shape the URL and the
 * filter forms already use, where '' means "no limit":
 *   - a left handle at the very start emits min = ''
 *   - a right handle at the very end emits max = ''  (shown as "17000+")
 * so a search is never narrowed by a bound the user did not really set.
 *
 * Without data (still loading, request failed, nothing published yet) the
 * chart and the slider are simply not drawn and the two boxes still work.
 */
interface PriceRangeSliderProps {
  /** undefined = no data (yet): only the Min / Max boxes are shown. */
  histogram: PriceHistogram | undefined
  min: string
  max: string
  onChange: (min: string, max: string) => void
}

const THUMB = '2rem' // keep in sync with .price-range-input in index.css

const BOX_CLASS =
  'w-full rounded-full border border-gray-300 bg-white px-4 py-3 text-center text-base text-gray-900 ' +
  'placeholder:text-gray-500 transition hover:border-gray-400 focus:border-brand-500 ' +
  'focus:ring-[3px] focus:ring-brand-500/20 focus:outline-none'

export default function PriceRangeSlider({ histogram, min, max, onChange }: PriceRangeSliderProps) {
  const { t } = useTranslation()

  // A slider needs a real range and at least one listing behind it.
  const bounds =
    histogram && histogram.total > 0 && histogram.max > histogram.min ? histogram : null

  const step = Math.max(1, bounds?.step ?? 1)
  const clamp = (value: number) => (bounds ? Math.min(bounds.max, Math.max(bounds.min, value)) : value)

  // Where the two handles sit. An empty or unreadable box means "at the end".
  const typedMin = min !== '' && Number.isFinite(Number(min)) ? Number(min) : null
  const typedMax = max !== '' && Number.isFinite(Number(max)) ? Number(max) : null
  const low = bounds ? clamp(typedMin ?? bounds.min) : 0
  const high = bounds ? clamp(typedMax ?? bounds.max) : 0

  const percent = (value: number) =>
    bounds ? ((value - bounds.min) / (bounds.max - bounds.min)) * 100 : 0

  // The handle position is the thumb CENTRE, which stays half a thumb away
  // from each end of the track: the same offset is applied to the coloured
  // part, so it always starts and ends exactly under the handles.
  const trackPosition = (value: number) =>
    `calc(${THUMB} / 2 + (100% - ${THUMB}) * ${percent(value) / 100})`

  const tallest = bounds ? Math.max(...bounds.buckets.map((bucket) => bucket.count), 1) : 1

  function moveLow(value: number) {
    if (!bounds) return
    // Never cross the other handle.
    const next = Math.min(value, high - step)
    onChange(next <= bounds.min ? '' : String(next), max)
  }

  function moveHigh(value: number) {
    if (!bounds) return
    const next = Math.max(value, low + step)
    onChange(min, next >= bounds.max ? '' : String(next))
  }

  /** A range typed the wrong way round is put back in order (the API refuses it). */
  function tidy() {
    if (typedMin !== null && typedMax !== null && typedMin > typedMax) {
      onChange(String(typedMax), String(typedMin))
    }
  }

  return (
    <div>
      {bounds && (
        <div className="relative">
          {/* The bars. px-4 = half a thumb, so they span the same width as
              the track. They stand directly ON the line (no gap), like the
              Airbnb chart. A bar is coloured when its band overlaps the
              selected range. */}
          <div className="flex h-20 items-end gap-[2px] px-4" aria-hidden>
            {bounds.buckets.map((bucket) => {
              const inside = bucket.to > low && bucket.from < high
              return (
                <div
                  key={bucket.from}
                  title={`${bucket.count}`}
                  className={cn(
                    'min-w-0 flex-1 rounded-t-[3px] transition-colors',
                    inside ? 'bg-brand-500' : 'bg-gray-200',
                  )}
                  // 6% minimum so a band with a single listing is still visible;
                  // an empty band is just a thin baseline.
                  style={{
                    height: bucket.count === 0 ? '2px' : `${Math.max(6, (bucket.count / tallest) * 100)}%`,
                  }}
                />
              )
            })}
          </div>

          {/* The handles row is pulled up by half its height, so the line (its
              middle) lies exactly on the bottom of the bars. */}
          <div className="relative -mt-4 h-8">
            {/* Grey line, then the coloured part between the handles. */}
            <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-gray-200" />
            <div
              className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-brand-500"
              style={{ left: trackPosition(low), right: `calc(100% - ${trackPosition(high)})` }}
            />

            {/* Two stacked ranges. When both handles sit at the far right
                the LOW one must be on top, or it could never be dragged
                back left - hence the z-index flip past the middle. */}
            <input
              type="range"
              className="price-range-input absolute inset-0 h-8 w-full"
              min={bounds.min}
              max={bounds.max}
              step={step}
              value={low}
              onChange={(event) => moveLow(Number(event.target.value))}
              aria-label={t('search.budgetMin')}
              style={{ zIndex: percent(low) > 50 ? 5 : 4 }}
            />
            <input
              type="range"
              className="price-range-input absolute inset-0 h-8 w-full"
              min={bounds.min}
              max={bounds.max}
              step={step}
              value={high}
              onChange={(event) => moveHigh(Number(event.target.value))}
              aria-label={t('search.budgetMax')}
              style={{ zIndex: percent(low) > 50 ? 4 : 5 }}
            />
          </div>
        </div>
      )}

      {/* Min pill on the left, Max pill on the right, labels above. */}
      <div className={cn('flex items-start justify-between gap-3', bounds && 'mt-3')}>
        <label className="block w-36 max-w-[48%]">
          <span className="mb-1.5 block text-center text-sm font-medium text-gray-500">{t('search.budgetMin')}</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={min}
            onChange={(event) => onChange(event.target.value, max)}
            onBlur={tidy}
            placeholder={bounds ? String(bounds.min) : t('search.budgetMin')}
            className={BOX_CLASS}
          />
        </label>
        <label className="block w-36 max-w-[48%]">
          <span className="mb-1.5 block text-center text-sm font-medium text-gray-500">{t('search.budgetMax')}</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={max}
            onChange={(event) => onChange(min, event.target.value)}
            onBlur={tidy}
            // "17000+": no upper limit - what the right handle at the end means.
            placeholder={bounds ? `${bounds.max}+` : t('search.budgetMax')}
            className={BOX_CLASS}
          />
        </label>
      </div>
    </div>
  )
}
