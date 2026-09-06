import { Link } from 'react-router-dom'
import type { Property } from '@/types/property'
import { formatMad, primaryPrice } from '@/lib/formatPrice'
import FavoriteButton from './FavoriteButton'

export default function PropertyCard({ property }: { property: Property }) {
  const cover = property.images[0]?.url ?? null
  const price = primaryPrice(property)

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Outside the <Link> below on purpose - a <button> can't legally
          nest inside an <a>, so the heart sits as a sibling, absolutely
          positioned over the image instead. */}
      <div className="absolute right-2 top-2 z-10">
        <FavoriteButton propertyId={property.id} />
      </div>

      <Link to={`/properties/${property.id}`} className="block">
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {cover ? (
            <img
              src={cover}
              alt={property.title}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              Pas de photo
            </div>
          )}
        </div>

        <div className="space-y-1 p-4">
          <h3 className="truncate font-semibold text-brand-700">{property.title}</h3>
          <p className="text-sm text-gray-500">{property.city}</p>
          {price ? (
            <p className="pt-1 font-medium text-brand-600">
              {formatMad(price.amount)} <span className="text-sm font-normal text-gray-500">/ {price.unit}</span>
            </p>
          ) : (
            <p className="pt-1 text-sm text-gray-400">Prix non défini</p>
          )}
        </div>
      </Link>
    </div>
  )
}
