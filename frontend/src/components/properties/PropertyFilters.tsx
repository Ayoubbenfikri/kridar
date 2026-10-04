import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { Button, Select } from '@/components/ui'
import { useAmenities } from '@/features/amenities/useAmenities'
import { useAmenityLabels } from '@/features/amenities/useAmenityLabels'
import type { ListingType, PropertyType, RentalType } from '@/types/property'

/**
 * Every value here is a string because it comes from - and goes back
 * to - the URL. The page owns the URL; this component only edits a
 * local draft and hands it back on "Apply", so typing a price does
 * not fire a request on every keystroke.
 */
export interface FilterValues {
  property_type: string
  rental_type: string
  min_price: string
  max_price: string
  bedrooms: string
  bathrooms: string
  max_guests: string
  amenities: string[]
}

export const EMPTY_FILTERS: FilterValues = {
  property_type: '',
  rental_type: '',
  min_price: '',
  max_price: '',
  bedrooms: '',
  bathrooms: '',
  max_guests: '',
  amenities: [],
}

/**
 * Values only — the labels are looked up during render (Phase 27).
 * A module constant of translated strings would be evaluated once at
 * import time and stay in the language the app booted in.
 */
const RENT_TYPE_VALUES: Array<PropertyType | ''> = [
  '',
  'apartment',
  'villa',
  'studio',
  'riad',
  'office',
  'commercial',
]

// Land can only be sold, so it only exists in the sale list.
const SALE_TYPE_VALUES: Array<PropertyType | ''> = [
  '',
  'apartment',
  'villa',
  'studio',
  'riad',
  'office',
  'land',
  'commercial',
]

const RENTAL_VALUES: Array<RentalType | ''> = ['', 'short_term', 'long_term']

const COUNT_OPTIONS = ['', '1', '2', '3', '4', '5']

// Plain <input> fields (min_price, max_price, guests) aren't part of this
// request — only the <select> fields switch to the shared <Select> below,
// so this class stays for those.
const NUMBER_CLASS =
  'h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-[15px] text-gray-900 transition ' +
  'hover:border-gray-300 focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/20 focus:outline-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-900">{label}</span>
      {children}
    </label>
  )
}

export default function PropertyFilters({
  value,
  listingType,
  onApply,
  onReset,
}: {
  value: FilterValues
  /** Which list this panel filters: a sale has no rental duration or guest count. */
  listingType: ListingType
  onApply: (next: FilterValues) => void
  onReset: () => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<FilterValues>(value)
  const { data: amenities } = useAmenities()
  const { amenityName } = useAmenityLabels()

  function set<K extends keyof FilterValues>(key: K, next: FilterValues[K]) {
    setDraft((current) => ({ ...current, [key]: next }))
  }

  function toggleAmenity(id: number) {
    const asString = String(id)
    setDraft((current) => ({
      ...current,
      amenities: current.amenities.includes(asString)
        ? current.amenities.filter((item) => item !== asString)
        : [...current.amenities, asString],
    }))
  }

  const isSale = listingType === 'sale'
  const typeValues = isSale ? SALE_TYPE_VALUES : RENT_TYPE_VALUES

  // The price column the backend compares depends on what is searched:
  // sale_price for a sale, price_per_month for a long_term rental,
  // price_per_night otherwise — so the label has to follow the same rule
  // or it would lie.
  const priceUnit = isSale
    ? t('common.currency')
    : draft.rental_type === 'long_term'
      ? t('filters.perMonth')
      : t('filters.perNight')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onApply(draft)
      }}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label={t('filters.propertyType')}
          value={draft.property_type}
          onChange={(value) => set('property_type', value)}
          options={typeValues.map((option) => ({
            value: option,
            label: option === '' ? t('propertyType.all') : t(`propertyType.${option}`),
          }))}
        />

        {!isSale && (
          <Select
            label={t('filters.rentalType')}
            value={draft.rental_type}
            onChange={(value) => set('rental_type', value)}
            options={RENTAL_VALUES.map((option) => ({
              value: option,
              label: option === '' ? t('rentalType.both') : t(`rentalType.${option}`),
            }))}
          />
        )}

        <Field label={t('filters.minPrice', { unit: priceUnit })}>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={draft.min_price}
            onChange={(event) => set('min_price', event.target.value)}
            className={NUMBER_CLASS}
          />
        </Field>

        <Field label={t('filters.maxPrice', { unit: priceUnit })}>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t('filters.noLimit')}
            value={draft.max_price}
            onChange={(event) => set('max_price', event.target.value)}
            className={NUMBER_CLASS}
          />
        </Field>

        {/* These three are minimums server-side (>=), so the labels say so. */}
        <Select
          label={t('filters.bedrooms')}
          value={draft.bedrooms}
          onChange={(value) => set('bedrooms', value)}
          options={COUNT_OPTIONS.map((count) => ({
            value: count,
            label: count === '' ? t('filters.any') : `${count}+`,
          }))}
        />

        <Select
          label={t('filters.bathrooms')}
          value={draft.bathrooms}
          onChange={(value) => set('bathrooms', value)}
          options={COUNT_OPTIONS.map((count) => ({
            value: count,
            label: count === '' ? t('filters.any') : `${count}+`,
          }))}
        />

        {!isSale && (
          <Field label={t('filters.guests')}>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder={t('filters.any')}
              value={draft.max_guests}
              onChange={(event) => set('max_guests', event.target.value)}
              className={NUMBER_CLASS}
            />
          </Field>
        )}
      </div>

      {amenities && amenities.length > 0 && (
        <fieldset className="mt-5 border-t border-gray-100 pt-5">
          <legend className="mb-3 text-sm font-semibold text-gray-900">
            {t('filters.amenities')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => {
              const checked = draft.amenities.includes(String(amenity.id))
              return (
                <label
                  key={amenity.id}
                  className={
                    'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition ' +
                    (checked
                      ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50')
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(amenity.id)}
                    className="sr-only"
                  />
                  {/* The amenities table holds one English name per row,
                      so the translation is looked up by that name in the
                      i18n files (see useAmenityLabels). */}
                  {amenityName(amenity.name)}
                </label>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">{t('filters.amenitiesHint')}</p>
        </fieldset>
      )}

      <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
        <Button type="submit">{t('filters.apply')}</Button>
        <Button
          type="button"
          variant="ghost"
          icon={<RotateCcw className="size-4" />}
          onClick={() => {
            setDraft(EMPTY_FILTERS)
            onReset()
          }}
        >
          {t('filters.reset')}
        </Button>
      </div>
    </form>
  )
}
