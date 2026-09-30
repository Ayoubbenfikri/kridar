import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  AlertCircle,
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarRange,
  Check,
  ImageOff,
  Lock,
  MapPin,
  Phone,
  Ruler,
  Star,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useProperty, useRevealPhone } from '@/features/properties/useProperties'
import { useSettings } from '@/features/settings/useSettings'
import { getErrorMessage } from '@/lib/apiErrors'
import { formatMad, primaryPrice } from '@/lib/formatPrice'
import ReviewsSection from '@/components/reviews/ReviewsSection'
import FavoriteButton from '@/components/properties/FavoriteButton'
import ContactOwnerCard from '@/components/properties/ContactOwnerCard'
import BookingPanel from '@/components/reservations/BookingPanel'
import PropertyLocationMap from '@/components/map/PropertyLocationMap'
import { Button, Card, EmptyState, Skeleton, buttonClasses } from '@/components/ui'
import type { Property, PropertyType, RentalType } from '@/types/property'

const TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Appartement',
  villa: 'Villa',
  studio: 'Studio',
  riad: 'Riad',
  office: 'Bureau',
}

const RENTAL_LABELS: Record<RentalType, string> = {
  short_term: 'Courte duree',
  long_term: 'Longue duree',
  both: 'Courte et longue duree',
}

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  )
}

/**
 * The owner's phone line, in the "Propriétaire" section.
 *
 * Every decision about WHETHER a number could ever be shown is made by
 * the backend (Property::listsOwnerPhone + the viewer check in
 * PropertyResource). This component presents each outcome:
 *
 *   owner_phone set              -> the number, as a tel: link
 *   available, not authenticated -> "log in to see it"
 *   available, email unverified  -> "verify your email"
 *   available, not yet unlocked  -> "reveal for X MAD" (Phase 29)
 *   not available at all         -> nothing
 *
 * `owner_phone_available` is what lets the page tell "log in to see it"
 * from "there is nothing" without promising a number the owner never
 * agreed to show. `owner_phone_unlocked` (Phase 29) is the newer split:
 * being logged in and verified is no longer enough on its own, the
 * viewer also has to have paid the one-off reveal fee — independent of
 * messaging credits entirely.
 */
function OwnerPhone({ property }: { property: Property }) {
  const { isAuthenticated, user } = useAuth()
  const { data: settings } = useSettings()
  const revealPhone = useRevealPhone()

  if (property.owner_phone) {
    return (
      <a
        href={`tel:${property.owner_phone.replace(/\s+/g, '')}`}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 transition hover:border-brand-500 hover:text-brand-600"
      >
        <Phone className="size-4 text-brand-600" aria-hidden />
        {property.owner_phone}
      </a>
    )
  }

  if (!property.owner_phone_available) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <Phone className="size-4 shrink-0 text-gray-400" aria-hidden />
        <span>
          <Link to="/login" className="font-semibold text-brand-600 transition hover:text-brand-700">
            Connectez-vous
          </Link>{' '}
          pour voir le numéro du propriétaire.
        </span>
      </p>
    )
  }

  if (!user?.email_verified) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <Phone className="size-4 shrink-0 text-gray-400" aria-hidden />
        Vérifiez votre email pour voir le numéro du propriétaire.
      </p>
    )
  }

  // Logged in, verified, a number exists — but (Phase 29) this viewer
  // hasn't paid to reveal THIS listing's number yet. Independent of
  // messaging: someone out of free contacts can still reveal a number.
  if (!property.owner_phone_unlocked) {
    const handleReveal = () => {
      revealPhone.mutate(property.id, {
        onSuccess: ({ redirectUrl }) => {
          // Full navigation, not a router push: the destination is the
          // payment provider, outside this app. Nothing to do when null
          // — the invalidation in useRevealPhone already refreshed the
          // property, and the number will appear on its own.
          if (redirectUrl) {
            window.location.href = redirectUrl
          }
        },
      })
    }

    return (
      <div className="mt-4">
        <Button
          variant="secondary"
          size="sm"
          icon={<Lock className="size-4" />}
          isLoading={revealPhone.isPending}
          onClick={handleReveal}
        >
          {revealPhone.isPending
            ? '...'
            : settings
              ? `Voir le numéro — ${formatMad(settings.phone_reveal_fee)}`
              : 'Voir le numéro'}
        </Button>
        {revealPhone.isError && (
          <p className="mt-2 flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {getErrorMessage(revealPhone.error)}
          </p>
        )}
      </div>
    )
  }

  return null
}

export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: property, isError } = useProperty(id)
  const [activeImage, setActiveImage] = useState(0)

  if (isError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="Propriété introuvable"
          description="Cette propriété n'existe pas, ou n'est plus disponible à la location."
          action={
            <Link to="/properties" className={buttonClasses()}>
              Voir les autres propriétés
            </Link>
          }
        />
      </main>
    )
  }

  if (!property) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-6 h-9 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <Skeleton className="mt-6 aspect-[16/10] w-full" />
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </main>
    )
  }

  const price = primaryPrice(property)
  const images = property.images
  const cover = images[activeImage] ?? images[0] ?? null

  // Decimal-cast fields come back from the backend as strings (see
  // types/property.ts) - both must be present (a property can be saved
  // with no location at all, they're nullable) before the map is worth
  // showing.
  const latitude = property.latitude !== null ? Number(property.latitude) : null
  const longitude = property.longitude !== null ? Number(property.longitude) : null
  const hasLocation = latitude !== null && longitude !== null && !Number.isNaN(latitude) && !Number.isNaN(longitude)

  // A plain-text, single-line version of the description for <meta
  // description> - the field itself can contain line breaks and runs
  // to any length, neither of which belongs in a search snippet.
  const metaDescription = property.description.replace(/\s+/g, ' ').trim().slice(0, 155)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{`${property.title} — ${property.city} | Krihouse`}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      <Link
        to="/properties"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux propriétés
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-balance text-gray-900">
            {property.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {property.address}, {property.city}
              {property.region ? `, ${property.region}` : ''}
            </span>
            {property.reviews_count > 0 && (
              <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                <Star className="size-4 fill-accent text-accent" aria-hidden />
                {property.average_rating}
                <span className="font-normal text-gray-500">({property.reviews_count} avis)</span>
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <FavoriteButton propertyId={property.id} />
        </div>
      </div>

      {/* Gallery: one large image, thumbnails underneath. Clicking a
          thumbnail swaps the large one - no lightbox, nothing to trap
          keyboard focus. */}
      <div className="mt-6">
        {cover ? (
          <>
            <img
              src={cover.url}
              alt={property.title}
              className="aspect-[16/10] w-full rounded-xl border border-gray-200 object-cover"
            />
            {images.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Photo ${index + 1}`}
                    aria-current={index === activeImage}
                    className={`size-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      index === activeImage
                        ? 'border-brand-600'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={image.url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 text-gray-400">
            <ImageOff className="size-8" aria-hidden />
            <span className="text-sm">Pas de photo</span>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* ---------------- Left column ---------------- */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Fact icon={<Building2 className="size-4.5" />} label={TYPE_LABELS[property.property_type]} />
              <Fact
                icon={<CalendarRange className="size-4.5" />}
                label={RENTAL_LABELS[property.rental_type]}
              />
              <Fact
                icon={<BedDouble className="size-4.5" />}
                label={`${property.bedrooms} chambre${property.bedrooms > 1 ? 's' : ''}`}
              />
              <Fact
                icon={<Bath className="size-4.5" />}
                label={`${property.bathrooms} salle${property.bathrooms > 1 ? 's' : ''} de bain`}
              />
              {property.max_guests !== null && (
                <Fact
                  icon={<Users className="size-4.5" />}
                  label={`${property.max_guests} voyageurs maximum`}
                />
              )}
              {property.area_sqm !== null && (
                <Fact icon={<Ruler className="size-4.5" />} label={`${Number(property.area_sqm)} m²`} />
              )}
            </div>
          </Card>

          <section className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Description</h2>
            <p className="mt-3 whitespace-pre-line text-gray-600">{property.description}</p>
          </section>

          {property.amenities.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Équipements</h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {property.amenities.map((amenity) => (
                  <li key={amenity.id} className="flex items-center gap-2.5 text-gray-700">
                    <Check className="size-4 shrink-0 text-brand-600" aria-hidden />
                    {amenity.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Only shown once a real position was picked on the map when
              the listing was created/edited - address/city text above
              already covers a property with no coordinates. */}
          {hasLocation && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Localisation</h2>
              <p className="mt-1 text-sm text-gray-500">
                {property.address}, {property.city}
                {property.region ? `, ${property.region}` : ''}
              </p>
              <div className="mt-3">
                <PropertyLocationMap latitude={latitude} longitude={longitude} />
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Propriétaire</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <User className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium text-gray-900">{property.owner?.name ?? 'Compte supprimé'}</p>
                <p className="text-sm text-gray-500">Propose ce logement</p>
              </div>
            </div>
            <OwnerPhone property={property} />
          </section>

          <ReviewsSection propertyId={property.id.toString()} />
        </div>

        {/* ---------------- Right column ---------------- */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            {price && (
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-gray-900">
                  {formatMad(price.amount)}
                </span>
                <span className="text-gray-500">/ {price.unit}</span>
              </div>
            )}
            <BookingPanel property={property} />

            {/* Under the booking panel on purpose. For a short-term stay
                booking is the main action and messaging is the fallback;
                for a long-term listing BookingPanel is the only path
                Kridar offers, and this is how the tenant actually
                reaches the owner to arrange the lease. */}
            <ContactOwnerCard property={property} />
          </div>
        </div>
      </div>
    </main>
  )
}
