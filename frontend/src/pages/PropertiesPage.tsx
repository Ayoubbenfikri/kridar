import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import PropertyCard from '@/components/properties/PropertyCard'
import PropertyFilters from '@/components/properties/PropertyFilters'
import type { FilterValues } from '@/components/properties/PropertyFilters'
import { useProperties } from '@/features/properties/useProperties'
import { useAmenities } from '@/features/amenities/useAmenities'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui'
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
  both: 'Courte ou longue duree',
}

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2.5 h-3.5 w-1/2" />
        <Skeleton className="mt-4 h-3.5 w-full" />
        <Skeleton className="mt-4 h-5 w-2/5" />
      </div>
    </div>
  )
}

/**
 * /properties - the listing. The URL is the single source of truth for
 * every filter: the query reads it, the filter form writes to it, and
 * the browser Back button therefore walks back through searches for
 * free. Nothing about a search is kept in component state.
 */
export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const { data: amenities } = useAmenities()

  const get = (key: string) => searchParams.get(key) ?? ''
  const page = Number(get('page') || '1')

  // Only the keys the backend accepts (PropertySearchRequest) are ever
  // forwarded, and only when non-empty - an empty `city=` would be sent
  // as a real filter and return nothing.
  const query = {
    page: page > 1 ? page : undefined,
    q: get('q') || undefined,
    city: get('city') || undefined,
    property_type: (get('property_type') || undefined) as PropertyType | undefined,
    rental_type: (get('rental_type') || undefined) as RentalType | undefined,
    min_price: get('min_price') ? Number(get('min_price')) : undefined,
    max_price: get('max_price') ? Number(get('max_price')) : undefined,
    bedrooms: get('bedrooms') ? Number(get('bedrooms')) : undefined,
    bathrooms: get('bathrooms') ? Number(get('bathrooms')) : undefined,
    max_guests: get('max_guests') ? Number(get('max_guests')) : undefined,
    amenities: searchParams.getAll('amenities').map(Number),
  }
  if (query.amenities.length === 0) delete (query as { amenities?: number[] }).amenities

  const { data, isError, isFetching } = useProperties(query)
  const properties = data?.data ?? []

  const filterValues: FilterValues = {
    property_type: get('property_type'),
    rental_type: get('rental_type'),
    min_price: get('min_price'),
    max_price: get('max_price'),
    bedrooms: get('bedrooms'),
    bathrooms: get('bathrooms'),
    max_guests: get('max_guests'),
    amenities: searchParams.getAll('amenities'),
  }

  /** Rewrites the URL, always dropping empty values and resetting to page 1. */
  function applyFilters(next: FilterValues) {
    const params = new URLSearchParams()
    if (get('q')) params.set('q', get('q'))
    if (get('city')) params.set('city', get('city'))

    for (const [key, raw] of Object.entries(next)) {
      if (Array.isArray(raw)) {
        raw.forEach((item) => params.append(key, item))
      } else if (raw) {
        params.set(key, raw)
      }
    }

    setSearchParams(params)
    setShowFilters(false)
  }

  function removeParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams)
    if (value === undefined) {
      params.delete(key)
    } else {
      const kept = params.getAll(key).filter((item) => item !== value)
      params.delete(key)
      kept.forEach((item) => params.append(key, item))
    }
    params.delete('page')
    setSearchParams(params)
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams)
    if (nextPage <= 1) params.delete('page')
    else params.set('page', String(nextPage))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = new FormData(event.currentTarget).get('q')?.toString().trim() ?? ''
    const params = new URLSearchParams(searchParams)
    if (term) params.set('q', term)
    else params.delete('q')
    params.delete('page')
    setSearchParams(params)
  }

  // One chip per active filter, each removable on its own.
  const chips: Array<{ key: string; value?: string; label: string }> = []
  if (get('q')) chips.push({ key: 'q', label: `"${get('q')}"` })
  if (get('city')) chips.push({ key: 'city', label: get('city') })
  if (get('property_type'))
    chips.push({ key: 'property_type', label: TYPE_LABELS[get('property_type') as PropertyType] })
  if (get('rental_type'))
    chips.push({ key: 'rental_type', label: RENTAL_LABELS[get('rental_type') as RentalType] })
  if (get('min_price')) chips.push({ key: 'min_price', label: `Min ${get('min_price')} MAD` })
  if (get('max_price')) chips.push({ key: 'max_price', label: `Max ${get('max_price')} MAD` })
  if (get('bedrooms')) chips.push({ key: 'bedrooms', label: `${get('bedrooms')}+ chambres` })
  if (get('bathrooms')) chips.push({ key: 'bathrooms', label: `${get('bathrooms')}+ sdb` })
  if (get('max_guests')) chips.push({ key: 'max_guests', label: `${get('max_guests')}+ voyageurs` })
  searchParams.getAll('amenities').forEach((id) => {
    const amenity = amenities?.find((item) => String(item.id) === id)
    chips.push({ key: 'amenities', value: id, label: amenity?.name ?? `Equipement ${id}` })
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Toutes les propriétés</h1>
      <p className="mt-1.5 text-gray-500">
        {isError
          ? 'Serveur injoignable'
          : data
            ? `${data.meta.total} logement${data.meta.total > 1 ? 's' : ''} disponible${data.meta.total > 1 ? 's' : ''}`
            : 'Chargement des logements...'}
      </p>

      {/* Toolbar: free-text search (q = partial match on title or city)
          and the filters toggle. */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={get('q')}
            key={get('q')}
            placeholder="Rechercher par titre ou ville..."
            aria-label="Rechercher"
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pr-3.5 pl-10.5 text-[15px] transition hover:border-gray-300 focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/20 focus:outline-none"
          />
        </form>

        <Button
          variant="secondary"
          icon={<SlidersHorizontal className="size-4" />}
          onClick={() => setShowFilters((open) => !open)}
          aria-expanded={showFilters}
        >
          Filtres
          {chips.length > 0 && (
            <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {chips.length}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="mt-4">
          <PropertyFilters
            value={filterValues}
            onApply={applyFilters}
            onReset={() => {
              const params = new URLSearchParams()
              if (get('q')) params.set('q', get('q'))
              setSearchParams(params)
              setShowFilters(false)
            }}
          />
        </div>
      )}

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value ?? ''}`}
              type="button"
              onClick={() => removeParam(chip.key, chip.value)}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 py-1 pr-2 pl-3 text-sm font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
            >
              {chip.label}
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">Retirer ce filtre</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSearchParams(new URLSearchParams())}
            className="text-sm font-medium text-gray-500 underline underline-offset-2 transition hover:text-gray-900"
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* Exhaustive cascade: error -> no data yet -> empty -> grid. */}
      <div className="mt-8">
        {isError ? (
          <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Impossible de charger les propriétés. Verifie que l'API tourne (php artisan serve), puis
            recharge la page.
          </Card>
        ) : !data ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title="Aucun logement ne correspond"
            description="Essaie d'elargir ta recherche : moins de filtres, une fourchette de prix plus large, ou une autre ville."
            action={
              chips.length > 0 ? (
                <Button variant="secondary" onClick={() => setSearchParams(new URLSearchParams())}>
                  Effacer les filtres
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div
              className={`grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}
            >
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {data.meta.last_page > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ChevronLeft className="size-4" />}
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Precedent
                </Button>
                <span className="text-sm text-gray-500">
                  Page {data.meta.current_page} / {data.meta.last_page}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= data.meta.last_page}
                  onClick={() => goToPage(page + 1)}
                >
                  Suivant
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
