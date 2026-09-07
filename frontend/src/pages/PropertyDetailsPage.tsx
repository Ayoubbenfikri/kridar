import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarRange,
  Check,
  ImageOff,
  MapPin,
  Ruler,
  Star,
  User,
  Users,
} from 'lucide-react'
import { useProperty } from '@/features/properties/useProperties'
import { formatMad, primaryPrice } from '@/lib/formatPrice'
import ReviewsSection from '@/components/reviews/ReviewsSection'
import FavoriteButton from '@/components/properties/FavoriteButton'
import BookingPanel from '@/components/reservations/BookingPanel'
import { Card, EmptyState, Skeleton, buttonClasses } from '@/components/ui'
import type { PropertyType, RentalType } from '@/types/property'

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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
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

          <section className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Propriétaire</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <User className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium text-gray-900">{property.owner.name}</p>
                <p className="text-sm text-gray-500">Propose ce logement</p>
              </div>
            </div>
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
          </div>
        </div>
      </div>
    </main>
  )
}
