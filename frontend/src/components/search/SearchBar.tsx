import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, MapPin, Search, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { PropertyType } from '@/types/property'

/**
 * The hero search. Every field here maps onto a parameter the backend
 * actually accepts (see PropertySearchRequest: city, property_type,
 * max_guests) - there is deliberately no "dates" field, because search
 * does not filter on availability; that is checked per property on its
 * details page.
 *
 * Submitting just puts the filled fields in the URL and goes to
 * /properties, which reads them back. That keeps a search shareable and
 * bookmarkable, and leaves /properties as the single place that talks
 * to the listing endpoint.
 */
const TYPE_OPTIONS: Array<{ value: PropertyType | ''; label: string }> = [
  { value: '', label: 'Tous les types' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'riad', label: 'Riad' },
  { value: 'office', label: 'Bureau' },
]

export default function SearchBar() {
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('')
  const [guests, setGuests] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    // Only send what the user actually filled - an empty `city=` would
    // otherwise be sent to the API as a real (empty) filter.
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    if (propertyType) params.set('property_type', propertyType)
    if (guests) params.set('max_guests', guests)

    navigate(`/properties${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 text-left shadow-lg sm:flex-row sm:items-stretch"
    >
      <label className="flex flex-1 cursor-text items-center gap-3 rounded-xl px-4 py-2.5 transition hover:bg-gray-50">
        <MapPin className="size-5 shrink-0 text-gray-400" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
            Destination
          </span>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Marrakech, Casablanca..."
            className="w-full border-0 bg-transparent p-0 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </span>
      </label>

      <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 transition hover:bg-gray-50 sm:border-l sm:border-gray-200">
        <Home className="size-5 shrink-0 text-gray-400" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
            Type de logement
          </span>
          <select
            value={propertyType}
            onChange={(event) => setPropertyType(event.target.value as PropertyType | '')}
            className="w-full cursor-pointer border-0 bg-transparent p-0 text-[15px] text-gray-900 focus:outline-none"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </span>
      </label>

      <label className="flex cursor-text items-center gap-3 rounded-xl px-4 py-2.5 transition hover:bg-gray-50 sm:w-40 sm:border-l sm:border-gray-200">
        <Users className="size-5 shrink-0 text-gray-400" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
            Voyageurs
          </span>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            placeholder="2"
            className="w-full border-0 bg-transparent p-0 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </span>
      </label>

      <Button type="submit" icon={<Search className="size-4.5" />} className="h-12 sm:w-auto">
        Rechercher
      </Button>
    </form>
  )
}
