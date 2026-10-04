import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, CalendarDays, CalendarRange, Home, MapPin, Search, Users, Wallet } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import {
  BUY_BUDGETS,
  LONG_BUDGETS,
  budgetLabel,
  searchUrl,
  type SearchMode,
} from '@/lib/homeSearch'
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
  const [budgetId, setBudgetId] = useState('')

  const isBuy = mode === 'buy'
  const budgets = isBuy ? BUY_BUDGETS : LONG_BUDGETS
  const typeValues = isBuy ? SALE_TYPES : RENT_TYPES
  const currency = t('common.currency')

  function changeMode(next: SearchMode) {
    onModeChange(next)
    // A budget or type picked for one intent would mean something else in
    // another (monthly rent vs sale price, "terrain" in a rental), and
    // guests only exist for a short stay: start those fields clean.
    setBudgetId('')
    setGuests('')
    if (next !== 'buy' && propertyType === 'land') setPropertyType('')
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const budget = budgets.find((preset) => preset.id === budgetId)

    // `q` and not `city`: the backend matches `city` exactly, so a
    // partial word typed here would return nothing. `q` is the partial
    // search (title OR city).
    navigate(
      searchUrl(mode, {
        q: city.trim() || undefined,
        property_type: propertyType || undefined,
        max_guests: mode === 'short' && guests ? guests : undefined,
        min_price: mode !== 'short' && budget?.min !== undefined ? String(budget.min) : undefined,
        max_price: mode !== 'short' && budget?.max !== undefined ? String(budget.max) : undefined,
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
        className="mb-3 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm"
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
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition sm:px-5',
                'focus-visible:ring-[3px] focus-visible:ring-brand-500/30 focus-visible:outline-none',
                active ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t(labelKey)}
            </button>
          )
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 text-start shadow-lg sm:flex-row sm:items-stretch"
      >
        <label className="flex flex-1 cursor-text items-center gap-3 rounded-xl px-4 py-2.5 transition hover:bg-gray-50">
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
        <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 transition hover:bg-gray-50 sm:border-s sm:border-gray-200">
          <Home className="size-5 shrink-0 text-gray-400" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              {t('search.propertyType')}
            </span>
            <select
              value={propertyType}
              onChange={(event) => setPropertyType(event.target.value as PropertyType | '')}
              className="w-full cursor-pointer border-0 bg-transparent p-0 text-[15px] text-gray-900 focus:outline-none"
            >
              {typeValues.map((value) => (
                <option key={value} value={value}>
                  {value === '' ? t('propertyType.all') : t(`propertyType.${value}`)}
                </option>
              ))}
            </select>
          </span>
        </label>

        {mode === 'short' ? (
          <label className="flex cursor-text items-center gap-3 rounded-xl px-4 py-2.5 transition hover:bg-gray-50 sm:w-40 sm:border-s sm:border-gray-200">
            <Users className="size-5 shrink-0 text-gray-400" aria-hidden />
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
          <label className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 transition hover:bg-gray-50 sm:w-48 sm:border-s sm:border-gray-200">
            <Wallet className="size-5 shrink-0 text-gray-400" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                {isBuy ? t('search.budget') : t('search.budgetMonth')}
              </span>
              <select
                value={budgetId}
                onChange={(event) => setBudgetId(event.target.value)}
                className="w-full cursor-pointer border-0 bg-transparent p-0 text-[15px] text-gray-900 focus:outline-none"
              >
                <option value="">{t('search.budgetAny')}</option>
                {budgets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {budgetLabel(preset, currency)}
                  </option>
                ))}
              </select>
            </span>
          </label>
        )}

        <Button type="submit" icon={<Search className="size-4.5" />} className="h-12 sm:w-auto">
          {t('search.submit')}
        </Button>
      </form>
    </div>
  )
}
