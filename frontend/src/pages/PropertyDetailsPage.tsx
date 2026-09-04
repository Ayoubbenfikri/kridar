import { Link, useParams } from 'react-router-dom'
import { useProperty } from '@/features/properties/useProperties'
import { formatMad, primaryPrice } from '@/lib/formatPrice'

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Appartement',
  villa: 'Villa',
  studio: 'Studio',
  riad: 'Riad',
  office: 'Bureau',
}

const RENTAL_TYPE_LABELS: Record<string, string> = {
  short_term: 'Courte durée',
  long_term: 'Longue durée',
  both: 'Courte et longue durée',
}

/**
 * Minimal details page (Phase 17, light pass) — no booking UI yet,
 * that's Phase 18. Just enough to browse a single property properly.
 */
export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: property, isLoading, isError } = useProperty(id)

  if (isLoading) {
    return <p className="mx-auto max-w-4xl px-4 py-8 text-gray-500">Chargement...</p>
  }

  if (isError || !property) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          Cette propriété est introuvable ou n'est plus disponible.
        </div>
        <Link to="/properties" className="mt-4 inline-block text-brand-600 hover:underline">
          ← Retour aux propriétés
        </Link>
      </div>
    )
  }

  const price = primaryPrice(property)

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/properties" className="text-sm text-brand-600 hover:underline">
        ← Retour aux propriétés
      </Link>

      <h1 className="mt-2 text-3xl font-semibold text-brand-700">{property.title}</h1>
      <p className="text-gray-500">
        {property.address}, {property.city}
        {property.region ? `, ${property.region}` : ''}
      </p>

      {property.images.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {property.images.map((image) => (
            <img
              key={image.id}
              src={image.url}
              alt={property.title}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex h-48 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
          Pas de photo
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
        <span>{PROPERTY_TYPE_LABELS[property.property_type] ?? property.property_type}</span>
        <span>·</span>
        <span>{RENTAL_TYPE_LABELS[property.rental_type] ?? property.rental_type}</span>
        <span>·</span>
        <span>{property.bedrooms} chambre(s)</span>
        <span>·</span>
        <span>{property.bathrooms} salle(s) de bain</span>
        {property.max_guests !== null && (
          <>
            <span>·</span>
            <span>{property.max_guests} voyageurs max</span>
          </>
        )}
      </div>

      {price && (
        <p className="mt-4 text-xl font-semibold text-brand-700">
          {formatMad(price.amount)} <span className="text-sm font-normal text-gray-500">/ {price.unit}</span>
        </p>
      )}

      <p className="mt-6 whitespace-pre-line text-gray-700">{property.description}</p>

      {property.amenities.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold text-brand-700">Équipements</h2>
          <ul className="flex flex-wrap gap-2">
            {property.amenities.map((amenity) => (
              <li key={amenity.id} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">
                {amenity.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-500">Proposé par {property.owner.name}</p>
    </main>
  )
}
