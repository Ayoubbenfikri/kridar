import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BedDouble, DoorOpen, ImageOff, MapPin } from 'lucide-react'
import { formatMad } from '@/lib/formatPrice'
import type { RoommateListing } from '@/types/roommateListing'

/**
 * Same reading order and layout conventions as PropertyCard: photo,
 * title, city, then the facts that matter (beds/bedrooms), price last.
 *
 * No favourite button (roommate posts are not part of the favourites
 * feature) and no is_featured badge (not a field on this model) — the
 * two visible differences from PropertyCard. A small type badge (Offer /
 * Request) takes the featured badge's corner instead, since knowing
 * which kind of post this is matters more here than on a property card.
 */
export default function RoommateListingCard({ listing }: { listing: RoommateListing }) {
  const { t } = useTranslation()

  const images = listing.images ?? []
  const cover = images.find((image) => image.is_cover) ?? images[0] ?? null

  return (
    <article className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg">
      <span className="absolute top-3 start-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 backdrop-blur-sm">
        {t(`roommateType.${listing.type}`)}
      </span>

      <Link to={`/roommates/${listing.id}`} className="block">
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {cover ? (
            <img
              src={cover.url}
              alt={listing.title}
              loading="lazy"
              className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1.5 text-gray-400">
              <ImageOff className="size-6" aria-hidden />
              <span className="text-xs">{t('roommateCard.noPhoto')}</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="truncate text-base font-semibold tracking-tight text-gray-900">
            {listing.title}
          </h3>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{listing.city}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-[13px] text-gray-500">
            {listing.beds !== null && (
              <span className="flex items-center gap-1.5">
                <DoorOpen className="size-3.5" aria-hidden /> {t('roommateCard.beds', { n: listing.beds })}
              </span>
            )}
            {listing.bedrooms !== null && (
              <span className="flex items-center gap-1.5">
                <BedDouble className="size-3.5" aria-hidden />{' '}
                {t('roommateCard.bedrooms', { n: listing.bedrooms })}
              </span>
            )}
          </div>

          {listing.price_per_person ? (
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-gray-900">
                {formatMad(listing.price_per_person)}
              </span>
              <span className="text-sm text-gray-500">{t('roommateCard.perPerson')}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-400">{t('roommateCard.priceNotSet')}</p>
          )}
        </div>
      </Link>
    </article>
  )
}
