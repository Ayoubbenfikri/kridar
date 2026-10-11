import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Building2, CalendarDays, CalendarRange, Check, ChevronDown, Home, MapPin, Search, Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'
import { track } from '@/lib/analytics'
import { searchUrl, type SearchMode } from '@/lib/homeSearch'
import type { PropertyType } from '@/types/property'

/**
 * The hero search: one tab per intent (short stay / monthly rental / buy),
 * the destination, and two compact pickers - property type and budget.
 *
 * Owner UX (Oct 2026): the home page had become a wall of filters (type,
 * guests, budget, city chips, type tiles). It keeps only these three
 * questions; everything else (guests, bedrooms, amenities...) lives on
 * the results page (PropertyFilters).
 *
 * Every value maps onto a parameter the backend already accepts
 * (PropertySearchRequest: q, property_type, min_price, max_price,
 * rental_type). The price column depends on the intent, decided by the
 * backend (EloquentPropertyRepository): price_per_night for a short stay,
 * price_per_month for a monthly rental, sale_price for a purchase.
 *
 * The mode is owned by the home page, so this component is controlled.
 */
const RENT_TYPES: Array<PropertyType | ''> = ['', 'apartment', 'villa', 'studio', 'riad', 'office', 'commercial']
const SALE_TYPES: Array<PropertyType | ''> = ['', 'apartment', 'villa', 'studio', 'riad', 'office', 'land', 'commercial']

/**
 * Ready-made price ranges (MAD). The backend receives the same
 * min_price / max_price it always did - the browser never sends free
 * text here. A night, a month and a sale price live on very different
 * scales, so each intent has its own list.
 */
interface BudgetPreset {
  id: string
  min?: number
  max?: number
}

const BUDGETS: Record<SearchMode, BudgetPreset[]> = {
  short: [{ id: 'any' }, { id: 'n1', max: 500 }, { id: 'n2', min: 500, max: 1000 }, { id: 'n3', min: 1000, max: 2000 }, { id: 'n4', min: 2000 }],
  long: [{ id: 'any' }, { id: 'r1', max: 3000 }, { id: 'r2', min: 3000, max: 6000 }, { id: 'r3', min: 6000 }],
  buy: [
    { id: 'any' },
    { id: 's1', max: 500_000 },
    { id: 's2', min: 500_000, max: 1_000_000 },
    { id: 's3', min: 1_000_000, max: 2_000_000 },
    { id: 's4', min: 2_000_000 },
  ],
}

/** 450 -> "450", 3000 -> "3 K", 1500000 -> "1.5 M". */
function shortAmount(amount: number): string {
  if (amount >= 1_000_000) return `${amount / 1_000_000} M`
  if (amount >= 1000) return `${amount / 1000} K`
  return String(amount)
}

function budgetLabel({ min, max }: BudgetPreset, currency: string): string {
  if (min !== undefined && max !== undefined) return `${shortAmount(min)} – ${shortAmount(max)} ${currency}`
  if (max !== undefined) return `< ${shortAmount(max)} ${currency}`
  return `> ${shortAmount(min as number)} ${currency}`
}

const TABS: Array<{ mode: SearchMode; icon: typeof Building2; labelKey: string }> = [
  { mode: 'short', icon: CalendarDays, labelKey: 'search.modeShort' },
  { mode: 'long', icon: CalendarRange, labelKey: 'search.modeLong' },
  { mode: 'buy', icon: Building2, labelKey: 'search.modeBuy' },
]

interface ChipOption {
  value: string
  label: string
}

/**
 * A small pill that opens a list - the compact replacement for the old
 * tall "LABEL / value" fields. Shows the chosen value, or `placeholder`
 * while nothing is chosen (first option).
 */
function FilterChip({
  icon,
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className,
}: {
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  options: ChipOption[]
  placeholder: string
  ariaLabel: string
  className?: string
}) {
  const isDefault = value === options[0]?.value
  const selected = options.find((option) => option.value === value)

  return (
    <Listbox as="div" value={value} onChange={onChange} className={cn('relative min-w-0', className)}>
      <ListboxButton
        aria-label={ariaLabel}
        className={cn(
          'flex h-10 w-full items-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition sm:gap-2 sm:px-3.5 sm:text-sm',
          'focus:outline-none data-[focus]:ring-[3px] data-[focus]:ring-brand-500/30',
          // Phone: soft grey pills inside the search card. Desktop: they sit
          // inside the white pill, so no fill until something is chosen.
          isDefault
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 sm:bg-transparent sm:hover:bg-gray-100'
            : 'bg-brand-50 text-brand-700 hover:bg-brand-100',
        )}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate text-start">{isDefault ? placeholder : selected?.label}</span>
        {/* No chevron on very narrow phones (< 380px): it is what made
            "Tous les types" get cut off at 360px. */}
        <ChevronDown className="hidden size-4 shrink-0 opacity-60 min-[380px]:block" aria-hidden />
      </ListboxButton>

      <ListboxOptions
        anchor="bottom start"
        transition
        className={cn(
          'z-50 mt-2 max-h-72 w-[max(var(--button-width),13rem)] overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg',
          'transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0',
          'focus:outline-none',
        )}
      >
        {options.map((option) => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 data-[focus]:bg-gray-50 data-[selected]:font-semibold data-[selected]:text-brand-700"
          >
            {option.label}
            <Check className="invisible size-4 shrink-0 text-brand-600 group-data-[selected]:visible" aria-hidden />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}

interface SearchBarProps {
  mode: SearchMode
  onModeChange: (mode: SearchMode) => void
}

export default function SearchBar({ mode, onModeChange }: SearchBarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('')
  const [budgetId, setBudgetId] = useState('any')

  const currency = t('common.currency')
  const budgets = BUDGETS[mode]
  const typeOptions: ChipOption[] = (mode === 'buy' ? SALE_TYPES : RENT_TYPES).map((value) => ({
    value,
    label: value === '' ? t('propertyType.all') : t(`propertyType.${value}`),
  }))
  const budgetOptions: ChipOption[] = budgets.map((preset) => ({
    value: preset.id,
    label: preset.id === 'any' ? t('search.budgetAny') : budgetLabel(preset, currency),
  }))
  const budgetPlaceholder =
    mode === 'short' ? t('search.budgetNight') : mode === 'long' ? t('search.budgetMonth') : t('search.budget')

  function changeMode(next: SearchMode) {
    onModeChange(next)
    // A budget picked for one intent means something else in another (a
    // night vs a month vs a sale price), and "land" is never rented:
    // start those clean.
    setBudgetId('any')
    if (next !== 'buy' && propertyType === 'land') setPropertyType('')
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    // The range comes from our own preset list, never from free text.
    const budget = budgets.find((preset) => preset.id === budgetId)

    track('search')

    // `q` and not `city`: the backend matches `city` exactly, so a
    // partial word typed here would return nothing. `q` is the partial
    // search (title OR city).
    navigate(
      searchUrl(mode, {
        q: city.trim() || undefined,
        property_type: propertyType || undefined,
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
        className="mb-3 flex w-full rounded-full border border-gray-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto"
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

      {/* ONE search box holding everything, so the button clearly
          searches with all of it (it used to sit inside the destination
          field on a phone and read as that field's own button).
          Phone: a card - destination, the two pickers, a full-width
          button. Desktop (sm+): the same elements in one pill. */}
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-3xl border border-gray-200 bg-white p-2 shadow-lg shadow-gray-200/60 transition focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-500/10 sm:flex sm:items-center sm:gap-1 sm:rounded-full sm:p-1.5 sm:ps-4"
      >
        <label className="flex min-w-0 items-center gap-2 px-2 sm:flex-1 sm:px-0">
          <MapPin className="size-5 shrink-0 text-gray-400" aria-hidden />
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder={t('search.destinationPlaceholder')}
            aria-label={t('search.destination')}
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 ps-1 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </label>

        <div className="mt-1 flex gap-2 border-t border-gray-100 pt-2 sm:mt-0 sm:shrink-0 sm:gap-1 sm:border-t-0 sm:border-s sm:border-gray-200 sm:ps-1 sm:pt-0">
          <FilterChip
            icon={<Home className="size-4 shrink-0" aria-hidden />}
            value={propertyType}
            onChange={(value) => setPropertyType(value as PropertyType | '')}
            options={typeOptions}
            placeholder={t('propertyType.all')}
            ariaLabel={t('search.propertyType')}
            className="flex-1 sm:flex-none"
          />
          <FilterChip
            icon={<Wallet className="size-4 shrink-0" aria-hidden />}
            value={budgetId}
            onChange={setBudgetId}
            options={budgetOptions}
            placeholder={budgetPlaceholder}
            ariaLabel={budgetPlaceholder}
            className="flex-1 sm:flex-none"
          />
        </div>

        <button
          type="submit"
          // A teal sheen (dark -> brand -> light, left to right) + soft
          // coloured glow + thin top highlight, instead of a flat dark
          // block. The text sits on the brand-600 middle (5.5:1 contrast
          // with white - the lighter end never reaches the label).
          className="group mt-2 inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-linear-to-r from-brand-700 via-brand-600 to-brand-500 px-6 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-6px_rgb(15_118_110/0.55)] transition hover:from-brand-800 hover:via-brand-700 hover:to-brand-600 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_10px_24px_-6px_rgb(15_118_110/0.65)] active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-brand-500/30 focus-visible:outline-none sm:mt-0 sm:h-11 sm:w-auto"
        >
          <Search className="size-4.5 transition group-hover:scale-110" aria-hidden />
          {t('search.submit')}
        </button>
      </form>
    </div>
  )
}
