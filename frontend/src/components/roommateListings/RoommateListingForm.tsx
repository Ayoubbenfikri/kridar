import { useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, Banknote, MapPin, Users } from 'lucide-react'
import { Button, Card, Input, Select, Textarea } from '@/components/ui'
import type { RoommateListingFormPayload } from '@/features/roommateListings/roommateListingsApi'
import type { ValidationErrors } from '@/lib/apiErrors'
import type { RoommateListing, RoommateListingType } from '@/types/roommateListing'

const TYPE_LABELS: Record<RoommateListingType, string> = {
  offer: "J'ai une place à offrir",
  request: 'Je cherche une colocation',
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
  price_per_person: string
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
  price_per_person: '',
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
    price_per_person: listing.price_per_person ?? '',
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

function buildPayload(form: FormState): RoommateListingFormPayload {
  return {
    type: form.type as RoommateListingType,
    title: form.title,
    description: form.description,
    city: form.city,
    neighborhood: form.neighborhood.trim() === '' ? undefined : form.neighborhood,
    address: form.address.trim() === '' ? undefined : form.address,
    price_per_person: toOptionalNumber(form.price_per_person),
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
 * PropertyForm: no map (roommate listings have no lat/lng field) and no
 * amenities (not part of this feature) — same "sibling component, not a
 * forced shared abstraction" reasoning already used for
 * ContactPosterCard/ContactOwnerCard and the messaging hooks.
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
            <Select
              label="Type de post"
              required
              value={form.type}
              onChange={(event) => update('type', event.target.value as RoommateListingType)}
              error={fieldError('type')}
            >
              <option value="" disabled>
                Choisir...
              </option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
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
            required={isOffer}
            value={form.furnished}
            onChange={(event) => update('furnished', event.target.value as FormState['furnished'])}
            error={fieldError('furnished')}
          >
            <option value="">Choisir...</option>
            <option value="yes">Meublé</option>
            <option value="no">Non meublé</option>
          </Select>

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
