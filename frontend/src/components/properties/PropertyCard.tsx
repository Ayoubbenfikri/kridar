import { Link } from 'react-router-dom'
import { Bath, BedDouble, ImageOff, MapPin, Ruler, Star, Users } from 'lucide-react'
import FavoriteButton from './FavoriteButton'
import { formatMad, primaryPrice } from '@/lib/formatPrice'
import type { Property } from '@/types/property'

/**
 * Reading order on the card follows the order a renter actually needs:
 * photo, then title + rating, then city, then the facts that decide a
 * shortlist (rooms / guests / area), then the price last as the payoff.
 *
 * The favourite button sits outside the <Link> on purpose - a <button>
 * cannot legally be nested inside an <a> - so it is absolutely
 * positioned over the image as a sibling instead.
 */
export default function PropertyCard({ property }: { property: Property }) {
  const cover = property.images.find((image) => image.is_cover) ?? property.images[0] ?? null
  const price = primaryPrice(property)
  const rating = property.average_rating

  return (
    <article className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg">
      <div className="absolute top-3 right-3 z-10">
        <FavoriteButton propertyId={property.id} />
      </div>

      {property.is_featured && (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 backdrop-blur-sm">
          Coup de coeur
        </span>
      )}

      <Link to={`/properties/${property.id}`} className="block">
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {cover ? (
            <img
              src={cover.url}
              alt={property.title}
              loading="lazy"
              className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1.5 text-gray-400">
              <ImageOff className="size-6" aria-hidden />
              <span className="text-xs">Pas de photo</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-base font-semibold tracking-tight text-gray-900">
              {property.title}
            </h3>
            {rating !== null && (
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-gray-900">
                <Star className="size-3.5 fill-accent text-accent" aria-hidden />
                {rating.toFixed(1).replace('.', ',')}
              </span>
            )}
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{property.city}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-[13px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <BedDouble className="size-3.5" aria-hidden /> {property.bedrooms} ch.
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="size-3.5" aria-hidden /> {property.bathrooms} sdb
            </span>
            {property.max_guests !== null ? (
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden /> {property.max_guests} pers.
              </span>
            ) : property.area_sqm !== null ? (
              <span className="flex items-center gap-1.5">
                <Ruler className="size-3.5" aria-hidden /> {Number(property.area_sqm)} m²
              </span>
            ) : null}
          </div>

          {price ? (
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-gray-900">
                {formatMad(price.amount)}
              </span>
              <span className="text-sm text-gray-500">/ {price.unit}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-400">Prix non defini</p>
          )}
        </div>
      </Link>
    </article>
  )
}
