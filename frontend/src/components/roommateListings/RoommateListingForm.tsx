import { useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, Banknote, Home, MapPin, Search, Users } from 'lucide-react'
import LocationPicker from '@/components/map/LocationPicker'
import { Button, Card, Input, Select, Textarea } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { RoommateListingFormPayload } from '@/features/roommateListings/roommateListingsApi'
import type { ValidationErrors } from '@/lib/apiErrors'
import type { RoommateListing, RoommateListingType } from '@/types/roommateListing'

const TYPE_LABELS: Record<RoommateListingType, string> = {
  offer: "J'ai une place à offrir",
  request: 'Je cherche une colocation',
}

const TYPE_ICONS: Record<RoommateListingType, typeof Home> = {
  offer: Home,
  request: Search,
}

/**
 * Plain strings for every controlled input (including numbers and the
 * furnished toggle) — same convention as PropertyForm.tsx, this codebase
 * doesn't use react-hook-form/zod. buildPayload() converts to the real
 * RoommateListingFormPayload shape on submit.
 */
interface FormState {
  type: RoommateListingType | ''
  title: string
  description: string
  city: string
  neighborhood: string
  address: string
  latitude: string
  longitude: string
  price_per_person: string
  budget_min: string
  budget_max: string
  beds: string
  bedrooms: string
  furnished: '' | 'yes' | 'no'
  people_count: string
  available_from: string
}

const EMPTY_FORM: FormState = {
  type: '',
  title: '',
  description: '',
  city: '',
  neighborhood: '',
  address: '',
  latitude: '',
  longitude: '',
  price_per_person: '',
  budget_min: '',
  budget_max: '',
  beds: '',
  bedrooms: '',
  furnished: '',
  people_count: '',
  available_from: '',
}

/** Pre-fills the form from an existing post (edit mode). */
function formStateFromListing(listing: RoommateListing): FormState {
  return {
    type: listing.type,
    title: listing.title,
    description: listing.description,
    city: listing.city,
    neighborhood: listing.neighborhood ?? '',
    address: listing.address ?? '',
    latitude: listing.latitude ?? '',
    longitude: listing.longitude ?? '',
    price_per_person: listing.price_per_person ?? '',
    budget_min: listing.budget_min ?? '',
    budget_max: listing.budget_max ?? '',
    beds: listing.beds !== null ? String(listing.beds) : '',
    bedrooms: listing.bedrooms !== null ? String(listing.bedrooms) : '',
    furnished: listing.furnished === null ? '' : listing.furnished ? 'yes' : 'no',
    people_count: listing.people_count !== null ? String(listing.people_count) : '',
    available_from: listing.available_from ?? '',
  }
}

function toOptionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value)
}

/** Same rule as toOptionalNumber, but returns null (not undefined) for
 * LocationPicker — it needs a real "no position yet" value to fall back
 * to its default map center, not "field omitted". Mirrors PropertyForm. */
function toOptionalCoordinate(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

function buildPayload(form: FormState): RoommateListingFormPayload {
  return {
    type: form.type as RoommateListingType,
    title: form.title,
    description: form.description,
    city: form.city,
    neighborhood: form.neighborhood.trim() === '' ? undefined : form.neighborhood,
    address: form.address.trim() === '' ? undefined : form.address,
    latitude: toOptionalNumber(form.latitude),
    longitude: toOptionalNumber(form.longitude),
    price_per_person: toOptionalNumber(form.price_per_person),
    budget_min: toOptionalNumber(form.budget_min),
    budget_max: toOptionalNumber(form.budget_max),
    beds: toOptionalNumber(form.beds),
    bedrooms: toOptionalNumber(form.bedrooms),
    furnished: form.furnished === '' ? undefined : form.furnished === 'yes',
    people_count: toOptionalNumber(form.people_count),
    available_from: form.available_from.trim() === '' ? undefined : form.available_from,
  }
}

/** One titled block of the form — same as PropertyForm's Section. */
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

interface RoommateListingFormProps {
  initialListing?: RoommateListing
  onSubmit: (payload: RoommateListingFormPayload) => void
  isSubmitting: boolean
  submitLabel: string
  validationErrors: ValidationErrors | null
  generalError?: string
}

/**
 * Create/edit form for a roommate post. Deliberately NOT a variant of
 * PropertyForm: no amenities (not part of this feature) — same "sibling
 * component, not a forced shared abstraction" reasoning already used for
 * ContactPosterCard/ContactOwnerCard and the messaging hooks. It does
 * reuse LocationPicker though, same as PropertyForm — a place is a place.
 */
export default function RoommateListingForm({
  initialListing,
  onSubmit,
  isSubmitting,
  submitLabel,
  validationErrors,
  generalError,
}: RoommateListingFormProps) {
  const [form, setForm] = useState<FormState>(
    initialListing ? formStateFromListing(initialListing) : EMPTY_FORM,
  )

  // Mirrors StoreRoommateListingRequest: price/beds/bedrooms/furnished are
  // required as soon as you're offering a place, people_count is required
  // as soon as you're the one looking. The backend enforces it either way
  // - this only keeps the form honest about it.
  const isOffer = form.type === 'offer'
  const isRequest = form.type === 'request'

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
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
        icon={<Users className="size-4.5" />}
        title="Informations"
        description="Ce que les autres voient en premier"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-gray-900">Type de post</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(Object.entries(TYPE_LABELS) as Array<[RoommateListingType, string]>).map(
                ([value, label]) => {
                  const Icon = TYPE_ICONS[value]
                  const selected = form.type === value
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update('type', value)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3.5 text-start transition',
                        selected
                          ? 'border-brand-500 bg-brand-50 ring-[3px] ring-brand-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-lg',
                          selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        <Icon className="size-4.5" aria-hidden />
                      </span>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          selected ? 'text-brand-900' : 'text-gray-700',
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  )
                },
              )}
            </div>
            {fieldError('type') && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {fieldError('type')}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Titre"
              required
              placeholder="Chambre disponible dans appartement lumineux"
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
              placeholder="Décrivez le logement, l'ambiance, ce que vous cherchez..."
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              error={fieldError('description')}
              hint="20 caractères minimum"
            />
          </div>
        </div>
      </Section>

      <Section icon={<MapPin className="size-4.5" />} title="Localisation">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Ville"
            required
            value={form.city}
            onChange={(event) => update('city', event.target.value)}
            error={fieldError('city')}
          />

          <Input
            label="Quartier (optionnel)"
            value={form.neighborhood}
            onChange={(event) => update('neighborhood', event.target.value)}
            error={fieldError('neighborhood')}
          />

          <div className="sm:col-span-2">
            <Input
              label="Adresse (optionnel)"
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
              error={fieldError('address')}
            />
          </div>

          {/* Only for 'offer': there is a real place to point at. A
              'request' post has no address either (same rule, see
              StoreRoommateListingRequest), so a map pin makes no sense
              there — nothing to show yet, someone else's home. */}
          {isOffer && (
            <div className="sm:col-span-2 space-y-2">
              <span className="block text-sm font-semibold text-gray-900">
                Position sur la carte (optionnel)
              </span>
              <LocationPicker
                // Same reason as PropertyForm: forces a fresh Leaflet
                // instance when this form switches to a different post
                // without a full page reload (create -> redirect to edit).
                key={initialListing?.id ?? 'new'}
                latitude={toOptionalCoordinate(form.latitude)}
                longitude={toOptionalCoordinate(form.longitude)}
                onChange={(lat, lng) => {
                  update('latitude', String(lat))
                  update('longitude', String(lng))
                }}
              />
              <p className="text-xs text-gray-500">
                Cliquez sur la carte ou déplacez le repère pour indiquer la position du logement.
                {form.latitude && form.longitude && (
                  <>
                    {' '}
                    Position actuelle : {Number(form.latitude).toFixed(5)},{' '}
                    {Number(form.longitude).toFixed(5)}
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
          )}
        </div>
      </Section>

      <Section
        icon={<Banknote className="size-4.5" />}
        title="Détails"
        description={
          form.type === ''
            ? "Choisissez d'abord un type de post ci-dessus"
            : 'Les champs marqués * sont obligatoires pour ce type de post'
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 'offer' asks a single rent figure per roommate. 'request' has
              no place yet, so instead of a single price it gives a budget
              RANGE ("I'm looking for something between 1000 and 1500
              MAD/month") — two fields, backed by budget_min/budget_max
              (see StoreRoommateListingRequest). */}
          {isRequest ? (
            <>
              <Input
                label="Budget min (MAD / mois) *"
                type="number"
                min={0}
                step="any"
                required
                value={form.budget_min}
                onChange={(event) => update('budget_min', event.target.value)}
                error={fieldError('budget_min')}
              />
              <Input
                label="Budget max (MAD / mois) *"
                type="number"
                min={0}
                step="any"
                required
                value={form.budget_max}
                onChange={(event) => update('budget_max', event.target.value)}
                error={fieldError('budget_max')}
              />
            </>
          ) : (
            <Input
              label={isOffer ? 'Prix par personne (MAD) *' : 'Prix par personne (MAD)'}
              type="number"
              min={0}
              step="any"
              required={isOffer}
              value={form.price_per_person}
              onChange={(event) => update('price_per_person', event.target.value)}
              error={fieldError('price_per_person')}
            />
          )}

          <Input
            label={isOffer ? 'Lits *' : 'Lits'}
            type="number"
            min={1}
            max={20}
            required={isOffer}
            value={form.beds}
            onChange={(event) => update('beds', event.target.value)}
            error={fieldError('beds')}
          />

          <Input
            label={isOffer ? 'Chambres *' : 'Chambres'}
            type="number"
            min={1}
            max={20}
            required={isOffer}
            value={form.bedrooms}
            onChange={(event) => update('bedrooms', event.target.value)}
            error={fieldError('bedrooms')}
          />

          <Select
            label={isOffer ? 'Meublé *' : 'Meublé'}
            value={form.furnished}
            onChange={(value) => update('furnished', value as FormState['furnished'])}
            error={fieldError('furnished')}
            options={[
              { value: '', label: 'Choisir...' },
              { value: 'yes', label: 'Meublé' },
              { value: 'no', label: 'Non meublé' },
            ]}
          />

          <Input
            label={isRequest ? 'Nombre de personnes *' : 'Nombre de personnes (optionnel)'}
            type="number"
            min={1}
            max={10}
            required={isRequest}
            value={form.people_count}
            onChange={(event) => update('people_count', event.target.value)}
            error={fieldError('people_count')}
          />

          <Input
            label="Disponible à partir du (optionnel)"
            type="date"
            value={form.available_from}
            onChange={(event) => update('available_from', event.target.value)}
            error={fieldError('available_from')}
          />
        </div>
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
