import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, Banknote, Building2, Check, MapPin, Sparkles, Users } from 'lucide-react'
import { useAmenities } from '@/features/amenities/useAmenities'
import { useAmenityLabels } from '@/features/amenities/useAmenityLabels'
import LocationPicker from '@/components/map/LocationPicker'
import { Button, Card, Input, Select, Skeleton, Textarea } from '@/components/ui'
import type { PropertyFormPayload } from '@/features/properties/propertiesApi'
import type { ValidationErrors } from '@/lib/apiErrors'
import type { Amenity, Property, PropertyType, RentalType } from '@/types/property'

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Appartement',
  villa: 'Villa',
  studio: 'Studio',
  riad: 'Riad',
  office: 'Bureau',
}

const RENTAL_TYPE_LABELS: Record<RentalType, string> = {
  short_term: 'Courte durée (par nuit)',
  long_term: 'Longue durée (par mois)',
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

/** Same rule as toOptionalNumber, but returns null (not undefined) for
 * LocationPicker - it needs a real "no position yet" value to fall back
 * to its default map center, not "field omitted". */
function toOptionalCoordinate(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
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

/**
 * Groups the amenity list by its `category` column, keeping the order the
 * API returned them in (first category seen comes first) and putting
 * amenities with no category (null) in a last group.
 */
function groupByCategory(amenities: Amenity[]): Array<{ category: string | null; items: Amenity[] }> {
  const groups = new Map<string | null, Amenity[]>()

  for (const amenity of amenities) {
    const items = groups.get(amenity.category) ?? []
    items.push(amenity)
    groups.set(amenity.category, items)
  }

  const result = Array.from(groups, ([category, items]) => ({ category, items }))
  return [
    ...result.filter((group) => group.category !== null),
    ...result.filter((group) => group.category === null),
  ]
}

/** One titled block of the form. */
function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  )
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
  const {
    data: amenities,
    isError: amenitiesFailed,
    refetch: refetchAmenities,
  } = useAmenities()
  const { amenityName, categoryName } = useAmenityLabels()
  const amenityGroups = useMemo(() => groupByCategory(amenities ?? []), [amenities])

  // Mirrors StorePropertyRequest: a nightly price (and max_guests) is
  // required as soon as the property is rented by the night, a monthly
  // price as soon as it is rented by the month. The backend enforces
  // it either way - this only keeps the form honest about it.
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section
        icon={<Building2 className="size-4.5" />}
        title="Informations"
        description="Ce que le voyageur voit en premier"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Titre"
              required
              placeholder="Villa avec piscine privée"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              error={fieldError('title')}
            />
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              required
              minLength={20}
              rows={5}
              placeholder="Décrivez le logement, le quartier, ce qui le rend agréable..."
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              error={fieldError('description')}
              hint="20 caractères minimum"
            />
          </div>

          <Select
            label="Type de bien"
            value={form.property_type}
            onChange={(value) => update('property_type', value as PropertyType)}
            error={fieldError('property_type')}
            options={[
              { value: '', label: 'Choisir...' },
              ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />

          <Select
            label="Type de location"
            value={form.rental_type}
            onChange={(value) => update('rental_type', value as RentalType)}
            error={fieldError('rental_type')}
            options={[
              { value: '', label: 'Choisir...' },
              ...Object.entries(RENTAL_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
      </Section>

      <Section icon={<MapPin className="size-4.5" />} title="Localisation">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Adresse"
              required
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
              error={fieldError('address')}
            />
          </div>

          <Input
            label="Ville"
            required
            value={form.city}
            onChange={(event) => update('city', event.target.value)}
            error={fieldError('city')}
          />

          <Input
            label="Région (optionnel)"
            value={form.region}
            onChange={(event) => update('region', event.target.value)}
            error={fieldError('region')}
          />

          <div className="sm:col-span-2 space-y-2">
            <span className="block text-sm font-semibold text-gray-900">
              Position sur la carte (optionnel)
            </span>
            <LocationPicker
              // Forces a fresh Leaflet map instance whenever this form is
              // showing a different property (e.g. PropertyCreatePage
              // redirects straight into PropertyEditPage for the property
              // it just created, without a full page reload) - see the
              // note in LocationPicker.tsx for why this is necessary.
              key={initialProperty?.id ?? 'new'}
              latitude={toOptionalCoordinate(form.latitude)}
              longitude={toOptionalCoordinate(form.longitude)}
              onChange={(lat, lng) => {
                update('latitude', String(lat))
                update('longitude', String(lng))
              }}
            />
            <p className="text-xs text-gray-500">
              Cliquez sur la carte ou déplacez le repère pour définir la position exacte du bien.
              {form.latitude && form.longitude && (
                <>
                  {' '}
                  Position actuelle : {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
                </>
              )}
            </p>
            {(fieldError('latitude') || fieldError('longitude')) && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {fieldError('latitude') ?? fieldError('longitude')}
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section icon={<Users className="size-4.5" />} title="Capacité">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Chambres"
            type="number"
            min={0}
            required
            value={form.bedrooms}
            onChange={(event) => update('bedrooms', event.target.value)}
            error={fieldError('bedrooms')}
          />

          <Input
            label="Salles de bain"
            type="number"
            min={0}
            required
            value={form.bathrooms}
            onChange={(event) => update('bathrooms', event.target.value)}
            error={fieldError('bathrooms')}
          />

          <Input
            label={needsNightly ? 'Voyageurs max *' : 'Voyageurs max (optionnel)'}
            type="number"
            min={1}
            required={needsNightly}
            value={form.max_guests}
            onChange={(event) => update('max_guests', event.target.value)}
            error={fieldError('max_guests')}
          />

          <Input
            label="Surface m² (optionnel)"
            type="number"
            min={0}
            step="any"
            value={form.area_sqm}
            onChange={(event) => update('area_sqm', event.target.value)}
            error={fieldError('area_sqm')}
          />
        </div>
      </Section>

      <Section
        icon={<Banknote className="size-4.5" />}
        title="Tarifs"
        description={
          form.rental_type === ''
            ? "Choisissez d'abord un type de location ci-dessus"
            : 'Les champs marqués * sont obligatoires pour ce type de location'
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={needsNightly ? 'Prix par nuit (MAD) *' : 'Prix par nuit (MAD)'}
            type="number"
            min={0}
            step="any"
            required={needsNightly}
            value={form.price_per_night}
            onChange={(event) => update('price_per_night', event.target.value)}
            error={fieldError('price_per_night')}
          />

          <Input
            label={needsMonthly ? 'Prix par mois (MAD) *' : 'Prix par mois (MAD)'}
            type="number"
            min={0}
            step="any"
            required={needsMonthly}
            value={form.price_per_month}
            onChange={(event) => update('price_per_month', event.target.value)}
            error={fieldError('price_per_month')}
          />
        </div>
      </Section>

      <Section
        icon={<Sparkles className="size-4.5" />}
        title="Équipements"
        description="Ce qui est inclus dans le logement"
      >
        {amenitiesFailed ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            <span>Impossible de charger les équipements.</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => refetchAmenities()}>
              Réessayer
            </Button>
          </div>
        ) : !amenities ? (
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Skeleton key={index} className="h-9 w-28 rounded-full" />
            ))}
          </div>
        ) : amenities.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun équipement n'est disponible pour le moment.</p>
        ) : (
          <div className="space-y-5">
            {amenityGroups.map((group) => (
              <fieldset key={group.category ?? 'other'}>
                <legend className="mb-2 text-sm font-medium text-gray-500">
                  {categoryName(group.category)}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((amenity) => {
                    const checked = form.amenity_ids.includes(amenity.id)
                    return (
                      <label
                        key={amenity.id}
                        className={
                          'flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition ' +
                          'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-brand-500/30 ' +
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
                        {checked && <Check className="size-3.5 shrink-0" aria-hidden />}
                        {amenityName(amenity.name)}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </Section>

      {generalError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {generalError}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
