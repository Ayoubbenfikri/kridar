import { useState, type FormEvent } from 'react'
import { useAmenities } from '@/features/amenities/useAmenities'
import type { PropertyFormPayload } from '@/features/properties/propertiesApi'
import type { ValidationErrors } from '@/lib/apiErrors'
import type { Property, PropertyType, RentalType } from '@/types/property'

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Appartement',
  villa: 'Villa',
  studio: 'Studio',
  riad: 'Riad',
  office: 'Bureau',
}

const RENTAL_TYPE_LABELS: Record<RentalType, string> = {
  short_term: 'Courte duree (par nuit)',
  long_term: 'Longue duree (par mois)',
  both: 'Les deux',
}

/**
 * Plain strings for every controlled input (including numbers) - this
 * app doesn't use react-hook-form/zod, same plain useState pattern as
 * AccountSettingsPage. buildPayload() below converts to the real
 * PropertyFormPayload shape on submit.
 */
interface FormState {
  title: string
  description: string
  property_type: PropertyType | ''
  rental_type: RentalType | ''
  address: string
  city: string
  region: string
  latitude: string
  longitude: string
  bedrooms: string
  bathrooms: string
  max_guests: string
  area_sqm: string
  price_per_night: string
  price_per_month: string
  amenity_ids: number[]
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  property_type: '',
  rental_type: '',
  address: '',
  city: '',
  region: '',
  latitude: '',
  longitude: '',
  bedrooms: '',
  bathrooms: '',
  max_guests: '',
  area_sqm: '',
  price_per_night: '',
  price_per_month: '',
  amenity_ids: [],
}

/**
 * Pre-fills the form from an existing property (edit mode). Decimal
 * fields come back from the backend as strings already, so most of
 * this is a direct copy - see types/property.ts.
 */
function formStateFromProperty(property: Property): FormState {
  return {
    title: property.title,
    description: property.description,
    property_type: property.property_type,
    rental_type: property.rental_type,
    address: property.address,
    city: property.city,
    region: property.region ?? '',
    latitude: property.latitude ?? '',
    longitude: property.longitude ?? '',
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    max_guests: property.max_guests !== null ? String(property.max_guests) : '',
    area_sqm: property.area_sqm ?? '',
    price_per_night: property.price_per_night ?? '',
    price_per_month: property.price_per_month ?? '',
    amenity_ids: property.amenities.map((amenity) => amenity.id),
  }
}

function toOptionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value)
}

function buildPayload(form: FormState): PropertyFormPayload {
  return {
    title: form.title,
    description: form.description,
    // Empty string can't happen for a submitted form (both selects are
    // required), the cast just satisfies TypeScript.
    property_type: form.property_type as PropertyType,
    rental_type: form.rental_type as RentalType,
    address: form.address,
    city: form.city,
    region: form.region.trim() === '' ? undefined : form.region,
    latitude: toOptionalNumber(form.latitude),
    longitude: toOptionalNumber(form.longitude),
    bedrooms: Number(form.bedrooms),
    bathrooms: Number(form.bathrooms),
    max_guests: toOptionalNumber(form.max_guests),
    area_sqm: toOptionalNumber(form.area_sqm),
    price_per_night: toOptionalNumber(form.price_per_night),
    price_per_month: toOptionalNumber(form.price_per_month),
    amenity_ids: form.amenity_ids,
  }
}

interface PropertyFormProps {
  initialProperty?: Property
  onSubmit: (payload: PropertyFormPayload) => void
  isSubmitting: boolean
  submitLabel: string
  validationErrors: ValidationErrors | null
  generalError?: string
}

export default function PropertyForm({
  initialProperty,
  onSubmit,
  isSubmitting,
  submitLabel,
  validationErrors,
  generalError,
}: PropertyFormProps) {
  const [form, setForm] = useState<FormState>(
    initialProperty ? formStateFromProperty(initialProperty) : EMPTY_FORM,
  )
  const { data: amenities, isLoading: amenitiesLoading } = useAmenities()

  const needsNightly = form.rental_type === 'short_term' || form.rental_type === 'both'
  const needsMonthly = form.rental_type === 'long_term' || form.rental_type === 'both'

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleAmenity(amenityId: number) {
    setForm((current) => ({
      ...current,
      amenity_ids: current.amenity_ids.includes(amenityId)
        ? current.amenity_ids.filter((id) => id !== amenityId)
        : [...current.amenity_ids, amenityId],
    }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(buildPayload(form))
  }

  function fieldError(field: string): string | undefined {
    return validationErrors?.[field]?.[0]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
            Titre
          </label>
          <input
            id="title"
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {fieldError('title') && <p className="mt-1 text-sm text-red-600">{fieldError('title')}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            required
            minLength={20}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {fieldError('description') && (
            <p className="mt-1 text-sm text-red-600">{fieldError('description')}</p>
          )}
        </div>

        <div>
          <label htmlFor="property_type" className="mb-1 block text-sm font-medium text-gray-700">
            Type de bien
          </label>
          <select
            id="property_type"
            value={form.property_type}
            onChange={(event) => update('property_type', event.target.value as PropertyType)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="" disabled>
              Choisir...
            </option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError('property_type') && (
            <p className="mt-1 text-sm text-red-600">{fieldError('property_type')}</p>
          )}
        </div>

        <div>
          <label htmlFor="rental_type" className="mb-1 block text-sm font-medium text-gray-700">
            Type de location
          </label>
          <select
            id="rental_type"
            value={form.rental_type}
            onChange={(event) => update('rental_type', event.target.value as RentalType)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="" disabled>
              Choisir...
            </option>
            {Object.entries(RENTAL_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError('rental_type') && (
            <p className="mt-1 text-sm text-red-600">{fieldError('rental_type')}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
            Adresse
          </label>
          <input
            id="address"
            value={form.address}
            onChange={(event) => update('address', event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {fieldError('address') && <p className="mt-1 text-sm text-red-600">{fieldError('address')}</p>}
        </div>

        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">
            Ville
          </label>
          <input
            id="city"
            value={form.city}
            onChange={(event) => update('city', event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {fieldError('city') && <p className="mt-1 text-sm text-red-600">{fieldError('city')}</p>}
        </div>

        <div>
          <label htmlFor="region" className="mb-1 block text-sm font-medium text-gray-700">
            Region (optionnel)
          </label>
          <input
            id="region"
            value={form.region}
            onChange={(event) => update('region', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="latitude" className="mb-1 block text-sm font-medium text-gray-700">
            Latitude (optionnel)
          </label>
          <input
            id="latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(event) => update('latitude', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="longitude" className="mb-1 block text-sm font-medium text-gray-700">
            Longitude (optionnel)
          </label>
          <input
            id="longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(event) => update('longitude', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="bedrooms" className="mb-1 block text-sm font-medium text-gray-700">
            Chambres
          </label>
          <input
            id="bedrooms"
            type="number"
            min={0}
            value={form.bedrooms}
            onChange={(event) => update('bedrooms', event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {fieldError('bedrooms') && <p className="mt-1 text-sm text-red-600">{fieldError('bedrooms')}</p>}
        </div>

        <div>
          <label htmlFor="bathrooms" className="mb-1 block text-sm font-medium text-gray-700">
            Salles de bain
          </label>
          <input
            id="bathrooms"
            type="number"
            min={0}
            value={form.bathrooms}
            onChange={(event) => update('bathrooms', event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {fieldError('bathrooms') && <p className="mt-1 text-sm text-red-600">{fieldError('bathrooms')}</p>}
        </div>

        <div>
          <label htmlFor="max_guests" className="mb-1 block text-sm font-medium text-gray-700">
            Voyageurs max {needsNightly && <span className="text-red-500">*</span>}
          </label>
          <input
            id="max_guests"
            type="number"
            min={1}
            value={form.max_guests}
            onChange={(event) => update('max_guests', event.target.value)}
            required={needsNightly}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {fieldError('max_guests') && (
            <p className="mt-1 text-sm text-red-600">{fieldError('max_guests')}</p>
          )}
        </div>

        <div>
          <label htmlFor="area_sqm" className="mb-1 block text-sm font-medium text-gray-700">
            Surface m2 (optionnel)
          </label>
          <input
            id="area_sqm"
            type="number"
            min={0}
            step="any"
            value={form.area_sqm}
            onChange={(event) => update('area_sqm', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="price_per_night" className="mb-1 block text-sm font-medium text-gray-700">
            Prix / nuit (MAD) {needsNightly && <span className="text-red-500">*</span>}
          </label>
          <input
            id="price_per_night"
            type="number"
            min={0}
            step="any"
            value={form.price_per_night}
            onChange={(event) => update('price_per_night', event.target.value)}
            required={needsNightly}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {fieldError('price_per_night') && (
            <p className="mt-1 text-sm text-red-600">{fieldError('price_per_night')}</p>
          )}
        </div>

        <div>
          <label htmlFor="price_per_month" className="mb-1 block text-sm font-medium text-gray-700">
            Prix / mois (MAD) {needsMonthly && <span className="text-red-500">*</span>}
          </label>
          <input
            id="price_per_month"
            type="number"
            min={0}
            step="any"
            value={form.price_per_month}
            onChange={(event) => update('price_per_month', event.target.value)}
            required={needsMonthly}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {fieldError('price_per_month') && (
            <p className="mt-1 text-sm text-red-600">{fieldError('price_per_month')}</p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Equipements</p>
        {amenitiesLoading && <p className="text-sm text-gray-500">Chargement...</p>}
        {amenities && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.map((amenity) => (
              <label key={amenity.id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.amenity_ids.includes(amenity.id)}
                  onChange={() => toggleAmenity(amenity.id)}
                  className="rounded border-gray-300"
                />
                {amenity.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {generalError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {generalError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-brand-600 px-4 py-2 text-white transition hover:scale-[1.05] hover:bg-brand-700 active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100"
      >
        {isSubmitting ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  )
}
