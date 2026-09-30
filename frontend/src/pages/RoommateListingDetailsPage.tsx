import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  BedDouble,
  CalendarRange,
  DoorOpen,
  ImageOff,
  MapPin,
  Sofa,
  Tag,
  User,
  Users,
} from 'lucide-react'
import { useRoommateListing } from '@/features/roommateListings/useRoommateListings'
import { formatMad } from '@/lib/formatPrice'
import ContactPosterCard from '@/components/roommateListings/ContactPosterCard'
import { Card, EmptyState, Skeleton, buttonClasses } from '@/components/ui'
import type { RoommateListingType } from '@/types/roommateListing'

/**
 * Hardcoded French, same as PropertyDetailsPage — this codebase's
 * details pages are not translated yet (see the note at the top of
 * frontend/src/i18n/fr.ts). RoommateListingsPage (the browse/filter
 * page) IS translated, matching PropertiesPage's own split.
 *
 * No BookingPanel (no reservations for a roommate post), no map (no
 * lat/lng on this model), no amenities (not a field here), no phone
 * reveal (contact happens through messaging instead — see
 * ContactPosterCard, ContactOwnerCard's roommate-post equivalent).
 */
const TYPE_LABELS: Record<RoommateListingType, string> = {
  offer: 'A une place, cherche un colocataire',
  request: 'Cherche une place',
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

export default function RoommateListingDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: listing, isError } = useRoommateListing(id)
  const [activeImage, setActiveImage] = useState(0)

  if (isError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<Users className="size-6" />}
          title="Annonce introuvable"
          description="Cette annonce n'existe pas, ou n'est plus disponible."
          action={
            <Link to="/roommates" className={buttonClasses()}>
              Voir les autres annonces
            </Link>
          }
        />
      </main>
    )
  }

  if (!listing) {
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
          <Skeleton className="h-56 w-full" />
        </div>
      </main>
    )
  }

  const images = listing.images
  const cover = images[activeImage] ?? images[0] ?? null

  const metaDescription = listing.description.replace(/\s+/g, ' ').trim().slice(0, 155)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{`${listing.title} — ${listing.city} | Krihouse`}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      <Link
        to="/roommates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux annonces
      </Link>

      {/* Header */}
      <div className="mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          <Tag className="size-3.5" aria-hidden />
          {TYPE_LABELS[listing.type]}
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance text-gray-900">
          {listing.title}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {listing.neighborhood ? `${listing.neighborhood}, ` : ''}
          {listing.city}
        </p>
      </div>

      {/* Gallery — same "one large image, thumbnails underneath" pattern
          as PropertyDetailsPage. */}
      <div className="mt-6">
        {cover ? (
          <>
            <img
              src={cover.url}
              alt={listing.title}
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
              {listing.beds !== null && (
                <Fact
                  icon={<DoorOpen className="size-4.5" />}
                  label={`${listing.beds} lit${listing.beds > 1 ? 's' : ''}`}
                />
              )}
              {listing.bedrooms !== null && (
                <Fact
                  icon={<BedDouble className="size-4.5" />}
                  label={`${listing.bedrooms} chambre${listing.bedrooms > 1 ? 's' : ''}`}
                />
              )}
              {listing.furnished !== null && (
                <Fact
                  icon={<Sofa className="size-4.5" />}
                  label={listing.furnished ? 'Meublé' : 'Non meublé'}
                />
              )}
              {listing.people_count !== null && (
                <Fact
                  icon={<Users className="size-4.5" />}
                  label={`${listing.people_count} personne${listing.people_count > 1 ? 's' : ''} recherchée${listing.people_count > 1 ? 's' : ''}`}
                />
              )}
              {listing.available_from !== null && (
                <Fact
                  icon={<CalendarRange className="size-4.5" />}
                  label={`Disponible à partir du ${new Date(listing.available_from).toLocaleDateString('fr-FR')}`}
                />
              )}
            </div>
          </Card>

          <section className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Description</h2>
            <p className="mt-3 whitespace-pre-line text-gray-600">{listing.description}</p>
          </section>

          {listing.address && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Adresse</h2>
              <p className="mt-1 text-sm text-gray-500">
                {listing.address}, {listing.city}
              </p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Publié par</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <User className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium text-gray-900">{listing.user?.name ?? 'Compte supprimé'}</p>
                <p className="text-sm text-gray-500">
                  {listing.type === 'offer' ? 'Propose cette annonce' : 'Cherche ce logement'}
                </p>
              </div>
            </div>
          </section>

          {/* No reviews section — reviews were never part of the
              roommate-listing requirements (they're tied to completed
              property reservations, see ReviewsSection/Phase 9), so
              nothing is borrowed from PropertyDetailsPage here. */}
        </div>

        {/* ---------------- Right column ---------------- */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            {listing.price_per_person && (
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-gray-900">
                  {formatMad(listing.price_per_person)}
                </span>
                <span className="text-gray-500">/ personne</span>
              </div>
            )}
            <ContactPosterCard listing={listing} />
          </div>
        </div>
      </div>
    </main>
  )
}
