import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAmenities } from '@/features/amenities/useAmenities'
import type { PropertyType, RentalType } from '@/types/property'

/**
 * Every value here is a string because it comes from - and goes back
 * to - the URL. The page owns the URL; this component only edits a
 * local draft and hands it back on "Appliquer", so typing a price does
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

const TYPE_OPTIONS: Array<{ value: PropertyType | ''; label: string }> = [
  { value: '', label: 'Tous les types' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'riad', label: 'Riad' },
  { value: 'office', label: 'Bureau' },
]

const RENTAL_OPTIONS: Array<{ value: RentalType | ''; label: string }> = [
  { value: '', label: 'Courte ou longue duree' },
  { value: 'short_term', label: 'Courte duree' },
  { value: 'long_term', label: 'Longue duree' },
]

const COUNT_OPTIONS = ['', '1', '2', '3', '4', '5']

const SELECT_CLASS =
  'h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-[15px] text-gray-900 transition ' +
  'hover:border-gray-300 focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/20 focus:outline-none'

const NUMBER_CLASS = SELECT_CLASS

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
  onApply,
  onReset,
}: {
  value: FilterValues
  onApply: (next: FilterValues) => void
  onReset: () => void
}) {
  const [draft, setDraft] = useState<FilterValues>(value)
  const { data: amenities } = useAmenities()

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

  // The price column the backend compares depends on rental_type
  // (price_per_month for long_term, price_per_night otherwise), so the
  // label has to follow the same rule or it would lie.
  const priceUnit = draft.rental_type === 'long_term' ? 'par mois' : 'par nuit'

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onApply(draft)
      }}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Type de logement">
          <select
            value={draft.property_type}
            onChange={(event) => set('property_type', event.target.value)}
            className={SELECT_CLASS}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Duree de location">
          <select
            value={draft.rental_type}
            onChange={(event) => set('rental_type', event.target.value)}
            className={SELECT_CLASS}
          >
            {RENTAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Prix min (${priceUnit})`}>
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

        <Field label={`Prix max (${priceUnit})`}>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Sans limite"
            value={draft.max_price}
            onChange={(event) => set('max_price', event.target.value)}
            className={NUMBER_CLASS}
          />
        </Field>

        {/* These three are minimums server-side (>=), so the labels say so. */}
        <Field label="Chambres (au moins)">
          <select
            value={draft.bedrooms}
            onChange={(event) => set('bedrooms', event.target.value)}
            className={SELECT_CLASS}
          >
            {COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count === '' ? 'Peu importe' : `${count}+`}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Salles de bain (au moins)">
          <select
            value={draft.bathrooms}
            onChange={(event) => set('bathrooms', event.target.value)}
            className={SELECT_CLASS}
          >
            {COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count === '' ? 'Peu importe' : `${count}+`}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Voyageurs (au moins)">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Peu importe"
            value={draft.max_guests}
            onChange={(event) => set('max_guests', event.target.value)}
            className={NUMBER_CLASS}
          />
        </Field>
      </div>

      {amenities && amenities.length > 0 && (
        <fieldset className="mt-5 border-t border-gray-100 pt-5">
          <legend className="mb-3 text-sm font-semibold text-gray-900">Equipements</legend>
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
                  {amenity.name}
                </label>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Un logement doit avoir <strong>tous</strong> les equipements coches pour apparaitre.
          </p>
        </fieldset>
      )}

      <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
        <Button type="submit">Appliquer les filtres</Button>
        <Button
          type="button"
          variant="ghost"
          icon={<RotateCcw className="size-4" />}
          onClick={() => {
            setDraft(EMPTY_FILTERS)
            onReset()
          }}
        >
          Tout effacer
        </Button>
      </div>
    </form>
  )
}
