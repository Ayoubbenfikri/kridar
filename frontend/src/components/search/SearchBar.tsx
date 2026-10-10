import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CalendarDays,
  CalendarRange,
  Home,
  MapPin,
  Search,
  Users,
  Wallet,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { SelectOption } from '@/components/ui/Select'
import SearchSelect from '@/components/search/SearchSelect'
import { cn } from '@/lib/cn'
import { track } from '@/lib/analytics'
import { searchUrl, type SearchMode } from '@/lib/homeSearch'
import type { PropertyType } from '@/types/property'

/**
 * The hero search, with one tab per intent (short stay / monthly rental /
 * buy). The tab decides which route the search goes to AND which third
 * field is shown: guests only mean something for a short stay, a budget
 * for a monthly rental or a purchase.
 *
 * Every field maps onto a parameter the backend already accepts
 * (see PropertySearchRequest: q, property_type, max_guests, min_price,
 * max_price, rental_type) - there is deliberately no "dates" field,
 * because search does not filter on availability.
 *
 * The mode is owned by the home page (it also drives the city chips and
 * the type tiles under the bar), so this component is controlled.
 *
 * Phase 27: the type list holds VALUES and translation keys, never
 * labels, so the dropdown follows the current language.
 */
const RENT_TYPES: Array<PropertyType | ''> = ['', 'apartment', 'villa', 'studio', 'riad', 'office', 'commercial']
const SALE_TYPES: Array<PropertyType | ''> = ['', 'apartment', 'villa', 'studio', 'riad', 'office', 'land', 'commercial']

/**
 * Budget choices. Each one is a ready-made price range (min and/or max,
 * in MAD): the backend gets the same min_price / max_price it always did.
 * A monthly rent and a sale price live on very different scales, so each
 * has its own list.
 */
interface BudgetPreset {
  id: string
  min?: number
  max?: number
}

const RENT_BUDGETS: BudgetPreset[] = [
  { id: 'any' },
  { id: 'r1', max: 3000 },
  { id: 'r2', min: 3000, max: 6000 },
  { id: 'r3', min: 6000 },
]

const SALE_BUDGETS: BudgetPreset[] = [
  { id: 'any' },
  { id: 's1', max: 500_000 },
  { id: 's2', min: 500_000, max: 1_000_000 },
  { id: 's3', min: 1_000_000, max: 2_000_000 },
  { id: 's4', min: 2_000_000 },
]

/** 3000 -> "3 K", 1500000 -> "1.5 M". */
function shortAmount(amount: number): string {
  if (amount >= 1_000_000) return `${amount / 1_000_000} M`
  return `${amount / 1000} K`
}

function budgetLabel(preset: BudgetPreset, currency: string, anyLabel: string): string {
  const { min, max } = preset
  if (min === undefined && max === undefined) return anyLabel
  if (min !== undefined && max !== undefined) return `${shortAmount(min)} \u2013 ${shortAmount(max)} ${currency}`
  if (max !== undefined) return `< ${shortAmount(max)} ${currency}`
  return `> ${shortAmount(min as number)} ${currency}`
}

const TABS: Array<{ mode: SearchMode; icon: typeof Home; labelKey: string }> = [
  { mode: 'short', icon: CalendarDays, labelKey: 'search.modeShort' },
  { mode: 'long', icon: CalendarRange, labelKey: 'search.modeLong' },
  { mode: 'buy', icon: Building2, labelKey: 'search.modeBuy' },
]

interface SearchBarProps {
  mode: SearchMode
  onModeChange: (mode: SearchMode) => void
}

export default function SearchBar({ mode, onModeChange }: SearchBarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('')
  const [guests, setGuests] = useState('')
  const [budgetId, setBudgetId] = useState('any')

  const isBuy = mode === 'buy'
  const typeValues = isBuy ? SALE_TYPES : RENT_TYPES
  const budgets = isBuy ? SALE_BUDGETS : RENT_BUDGETS
  const currency = t('common.currency')

  const typeOptions: SelectOption[] = typeValues.map((value) => ({
    value,
    label: value === '' ? t('propertyType.all') : t(`propertyType.${value}`),
  }))
  const budgetOptions: SelectOption[] = budgets.map((preset) => ({
    value: preset.id,
    label: budgetLabel(preset, currency, t('search.budgetAny')),
  }))

  function changeMode(next: SearchMode) {
    onModeChange(next)
    // A budget or type picked for one intent would mean something else in
    // another (monthly rent vs sale price, "terrain" in a rental), and
    // guests only exist for a short stay: start those fields clean.
    setBudgetId('any')
    setGuests('')
    if (next !== 'buy' && propertyType === 'land') setPropertyType('')
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    // The range comes from our own preset list, never from free text.
    const budget = mode === 'short' ? undefined : budgets.find((preset) => preset.id === budgetId)

    track('search')

    // `q` and not `city`: the backend matches `city` exactly, so a
    // partial word typed here would return nothing. `q` is the partial
    // search (title OR city).
    navigate(
      searchUrl(mode, {
        q: city.trim() || undefined,
        property_type: propertyType || undefined,
        max_guests: mode === 'short' && guests ? guests : undefined,
        min_price: budget?.min !== undefined ? String(budget.min) : undefined,
        max_price: budget?.max !== undefined ? String(budget.max) : undefined,
      }),
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Intent tabs. A real tablist: arrow-key navigation is not wired,
          but each tab is a button, so Tab/Enter work. */}
      <div
        role="tablist"
        aria-label={t('search.modeLabel')}
        className="mb-2.5 flex w-full rounded-full border border-gray-200 bg-white p-1 shadow-sm sm:mb-3 sm:inline-flex sm:w-auto"
      >
        {TABS.map(({ mode: tabMode, icon: Icon, labelKey }) => {
          const active = tabMode === mode
          return (
            <button
              key={tabMode}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => changeMode(tabMode)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[13px] font-semibold whitespace-nowrap transition sm:flex-none sm:px-5 sm:py-1.5 sm:text-sm',
                'focus-visible:ring-[3px] focus-visible:ring-brand-500/30 focus-visible:outline-none',
                active ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="hidden size-4 sm:block" aria-hidden />
              {t(labelKey)}
            </button>
          )
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 text-start shadow-lg sm:flex sm:flex-row sm:items-stretch"
      >
        <label className="col-span-2 flex flex-1 cursor-text items-center gap-3 rounded-xl border-b border-gray-100 px-3 py-2 transition hover:bg-gray-50 sm:col-span-1 sm:border-b-0 sm:px-4 sm:py-2.5">
          <MapPin className="size-5 shrink-0 text-gray-400" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              {t('search.destination')}
            </span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder={t('search.destinationPlaceholder')}
              className="w-full border-0 bg-transparent p-0 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </span>
        </label>

        {/* border-s rather than border-l: the divider belongs between the
            fields, whichever way they are laid out. */}
        <SearchSelect
          label={t('search.propertyType')}
          icon={<Home className="hidden size-5 shrink-0 text-gray-400 sm:block" aria-hidden />}
          value={propertyType}
          onChange={(value) => setPropertyType(value as PropertyType | '')}
          options={typeOptions}
          className={cn(
            'flex-1 sm:col-span-1 sm:border-s sm:border-gray-200',
            // The budget needs a full row on a phone, so the type does too.
            mode !== 'short' && 'col-span-2 border-b border-gray-100 sm:border-b-0',
          )}
        />

        {mode === 'short' ? (
          <label className="flex min-w-0 cursor-text items-center gap-3 rounded-xl border-s border-gray-100 px-3 py-2 transition hover:bg-gray-50 sm:w-40 sm:border-gray-200 sm:px-4 sm:py-2.5">
            <Users className="hidden size-5 shrink-0 text-gray-400 sm:block" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                {t('search.guests')}
              </span>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                placeholder={t('search.guestsPlaceholder')}
                className="w-full border-0 bg-transparent p-0 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </span>
          </label>
        ) : (
          <SearchSelect
            label={`${isBuy ? t('search.budget') : t('search.budgetMonth')} (${currency})`}
            icon={<Wallet className="hidden size-5 shrink-0 text-gray-400 sm:block" aria-hidden />}
            value={budgetId}
            onChange={setBudgetId}
            options={budgetOptions}
            className="col-span-2 sm:col-span-1 sm:w-56 sm:border-s sm:border-gray-200"
          />
        )}

        <Button type="submit" icon={<Search className="size-4.5" />} className="col-span-2 h-11 sm:col-span-1 sm:h-12 sm:w-auto">
          {t('search.submit')}
        </Button>
      </form>
    </div>
  )
}
