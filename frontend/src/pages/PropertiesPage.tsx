import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LayoutGrid,
  Map as MapIcon,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import PropertyCard from '@/components/properties/PropertyCard'
import PropertyFilters from '@/components/properties/PropertyFilters'
import type { FilterValues } from '@/components/properties/PropertyFilters'
import PropertiesMapView from '@/components/map/PropertiesMapView'
import { useProperties } from '@/features/properties/useProperties'
import { useAmenities } from '@/features/amenities/useAmenities'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ListingType, PropertySort, PropertyType, RentalType } from '@/types/property'

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
 * /properties (rentals) and /buy (properties for sale) - the listing. The
 * two routes render this same page; `listingType` says which one. It is a
 * prop (not a URL param) so the mode is part of the path: NavLink can tell
 * "Louer" and "Acheter" apart, and a link to /buy never needs a query.
 *
 * The URL is the single source of truth for every filter: the query reads
 * it, the quick chips and the filter form write to it, and the browser
 * Back button therefore walks back through searches for free. Nothing
 * about a search is kept in component state.
 */
export default function PropertiesPage({ listingType }: { listingType: ListingType }) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')
  const { data: amenities } = useAmenities()

  const isSale = listingType === 'sale'
  const get = (key: string) => searchParams.get(key) ?? ''
  const page = Number(get('page') || '1')

  const sortParam = get('sort')
  const sort: PropertySort | undefined =
    sortParam === 'price_asc' || sortParam === 'price_desc' ? sortParam : undefined

  // Only the keys the backend accepts (PropertySearchRequest) are ever
  // forwarded, and only when non-empty - an empty `city=` would be sent
  // as a real filter and return nothing. A sale has no rental duration or
  // guest count, so those two are never sent in a sale search (a leftover
  // in the URL is ignored; the backend would ignore it too).
  const query = {
    page: page > 1 ? page : undefined,
    listing_type: (isSale ? 'sale' : undefined) as ListingType | undefined,
    sort,
    q: get('q') || undefined,
    city: get('city') || undefined,
    property_type: (get('property_type') || undefined) as PropertyType | undefined,
    rental_type: (!isSale && get('rental_type') ? get('rental_type') : undefined) as
      | RentalType
      | undefined,
    min_price: get('min_price') ? Number(get('min_price')) : undefined,
    max_price: get('max_price') ? Number(get('max_price')) : undefined,
    bedrooms: get('bedrooms') ? Number(get('bedrooms')) : undefined,
    bathrooms: get('bathrooms') ? Number(get('bathrooms')) : undefined,
    max_guests: !isSale && get('max_guests') ? Number(get('max_guests')) : undefined,
    amenities: searchParams.getAll('amenities').map(Number),
  }
  if (query.amenities.length === 0) delete (query as { amenities?: number[] }).amenities

  const { data, isError, isFetching } = useProperties(query)
  const properties = data?.data ?? []

  // Sub-phase #3 (map view): a SEPARATE query, only fetched once the
  // owner actually switches to map view, using the same active filters
  // but its own per_page (the backend's max, see PropertySearchRequest)
  // and no page number - the map wants every matching result it can
  // get, not one grid page. Kept apart from `query`/`data` above so the
  // grid's own pagination is completely unaffected by this.
  const mapQuery = { ...query, page: undefined, per_page: 50 }
  const { data: mapData, isFetching: isMapFetching } = useProperties(mapQuery, {
    enabled: view === 'map',
  })

  const filterValues: FilterValues = {
    property_type: get('property_type'),
    rental_type: isSale ? '' : get('rental_type'),
    min_price: get('min_price'),
    max_price: get('max_price'),
    bedrooms: get('bedrooms'),
    bathrooms: get('bathrooms'),
    max_guests: isSale ? '' : get('max_guests'),
    amenities: searchParams.getAll('amenities'),
  }

  /**
   * The Louer | Acheter switch. Carries over only what means the same in
   * both modes (the text search and the city): a price range, a rental
   * duration or a property type chosen for one mode would be misread in
   * the other (nightly rent vs a sale price, "terrain" in a rental...).
   */
  function otherModeSearch(): string {
    const params = new URLSearchParams()
    if (get('q')) params.set('q', get('q'))
    if (get('city')) params.set('city', get('city'))
    const search = params.toString()
    return search ? `?${search}` : ''
  }

  /** Rewrites the URL, always dropping empty values and resetting to page 1. */
  function applyFilters(next: FilterValues) {
    const params = new URLSearchParams()
    if (get('q')) params.set('q', get('q'))
    if (get('city')) params.set('city', get('city'))
    // The sort is a preference, not a filter: applying filters keeps it.
    if (sort) params.set('sort', sort)

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

  // One chip per active filter, each removable on its own. Labels are
  // built during render, so they follow the language like everything else.
  const chips: Array<{ key: string; value?: string; label: string }> = []
  if (get('q')) chips.push({ key: 'q', label: `"${get('q')}"` })
  if (get('city')) chips.push({ key: 'city', label: get('city') })
  if (get('property_type'))
    chips.push({ key: 'property_type', label: t(`propertyType.${get('property_type')}`) })
  if (get('rental_type'))
    chips.push({ key: 'rental_type', label: t(`rentalType.${get('rental_type')}`) })
  if (get('min_price'))
    chips.push({
      key: 'min_price',
      label: t('properties.chipMin', { value: get('min_price'), currency: t('common.currency') }),
    })
  if (get('max_price'))
    chips.push({
      key: 'max_price',
      label: t('properties.chipMax', { value: get('max_price'), currency: t('common.currency') }),
    })
  if (get('bedrooms'))
    chips.push({ key: 'bedrooms', label: t('properties.chipBedrooms', { n: get('bedrooms') }) })
  if (get('bathrooms'))
    chips.push({ key: 'bathrooms', label: t('properties.chipBathrooms', { n: get('bathrooms') }) })
  if (get('max_guests'))
    chips.push({ key: 'max_guests', label: t('properties.chipGuests', { n: get('max_guests') }) })
  searchParams.getAll('amenities').forEach((id) => {
    const amenity = amenities?.find((item) => String(item.id) === id)
    // Amenity names are database values, not interface text — shown as
    // they come. The fallback only appears while the amenities list is
    // still loading.
    chips.push({
      key: 'amenities',
      value: id,
      label: amenity?.name ?? t('properties.chipAmenity', { id }),
    })
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Helmet>
        <title>
          {isSale
            ? 'Biens à vendre au Maroc — Krihouse'
            : 'Propriétés à louer au Maroc — Krihouse'}
        </title>
        <meta
          name="description"
          content={
            isSale
              ? 'Parcourez les appartements, villas, terrains et locaux commerciaux à vendre au Maroc, avec filtres par ville, prix et type de bien.'
              : 'Parcourez les appartements, villas, studios et riads disponibles à la location au Maroc, avec filtres par ville, prix et type de bien.'
          }
        />
      </Helmet>

      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {isSale ? t('properties.saleTitle') : t('properties.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-500 sm:mt-1.5 sm:text-base">
        {isError
          ? t('properties.serverDown')
          : data
            ? t(isSale ? 'properties.saleAvailable' : 'properties.available', { n: data.meta.total })
            : t(isSale ? 'properties.saleLoading' : 'properties.loading')}
      </p>

      {/* Louer | Acheter - the same two cards as the roommates page. Two
          columns even on a phone, with smaller cards there, so the switch
          costs one thin row instead of two big ones. The active one is
          plain markup, the other a link to the other route (see
          otherModeSearch for what it carries). */}
      <nav
        aria-label={t('properties.modeLabel')}
        className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3"
      >
        {(
          [
            { type: 'rent', to: '/properties', label: t('nav.rent'), icon: KeyRound },
            { type: 'sale', to: '/buy', label: t('nav.buy'), icon: Building2 },
          ] as const
        ).map(({ type: modeType, to, label, icon: Icon }) => {
          const isActive = modeType === listingType
          const content = (
            <>
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-10',
                  isActive ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500',
                )}
              >
                <Icon className="size-4 sm:size-5" aria-hidden />
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  isActive ? 'text-brand-900' : 'text-gray-900',
                )}
              >
                {label}
              </span>
            </>
          )
          const classes = cn(
            'flex items-center gap-2 rounded-xl border p-2.5 text-start transition sm:gap-3 sm:p-4',
            isActive
              ? 'border-brand-500 bg-brand-50 ring-[3px] ring-brand-500/20'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
          )
          return isActive ? (
            <span key={modeType} aria-current="page" className={classes}>
              {content}
            </span>
          ) : (
            <Link
              key={modeType}
              to={{ pathname: to, search: otherModeSearch() }}
              className={classes}
            >
              {content}
            </Link>
          )
        })}
      </nav>

      {/* Toolbar: [search | Filters | list/map] on one line. On a phone the
          Filters label and the list/map labels are dropped (icons only) so
          the search box keeps room. */}
      <div className="mt-3 flex items-center gap-2 sm:mt-6 sm:gap-3">
        {/* Free-text search (q = partial match on title or city). */}
        <form onSubmit={submitSearch} className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 start-3.5 size-4.5 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={get('q')}
            key={get('q')}
            placeholder={t('properties.searchPlaceholder')}
            aria-label={t('properties.searchLabel')}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pe-3.5 ps-10.5 text-[15px] transition hover:border-gray-300 focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/20 focus:outline-none"
          />
        </form>

        <Button
          variant="secondary"
          icon={<SlidersHorizontal className="size-4" />}
          onClick={() => setShowFilters((open) => !open)}
          aria-expanded={showFilters}
        >
          <span className="sr-only sm:not-sr-only">{t('properties.filters')}</span>
          {chips.length > 0 && (
            <span className="ms-0.5 flex size-5 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {chips.length}
            </span>
          )}
        </Button>

        {/* Sub-phase #3: list/map toggle. A segmented control rather
            than a permanent side-by-side split - works the same on
            mobile and desktop with no extra responsive layout. The text
            is hidden on a phone (icons only) to save width. */}
        <div className="flex shrink-0 rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            aria-label={t('properties.viewList')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
              view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="size-4" aria-hidden />
            <span className="hidden sm:inline">{t('properties.viewList')}</span>
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            aria-pressed={view === 'map'}
            aria-label={t('properties.viewMap')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
              view === 'map' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <MapIcon className="size-4" aria-hidden />
            <span className="hidden sm:inline">{t('properties.viewMap')}</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4">
          <PropertyFilters
            // The panel edits a local draft. A chip clicked while it is
            // open changes the URL underneath it: remounting on any URL
            // change keeps the draft from going stale and then undoing the
            // chip on "Apply".
            key={searchParams.toString()}
            value={filterValues}
            listingType={listingType}
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
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 py-1 pe-2 ps-3 text-sm font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
            >
              {chip.label}
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">{t('properties.removeFilter')}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSearchParams(new URLSearchParams())}
            className="text-sm font-medium text-gray-500 underline underline-offset-2 transition hover:text-gray-900"
          >
            {t('properties.clearAll')}
          </button>
        </div>
      )}

      {/* Exhaustive cascade: error -> no data yet -> empty -> grid. */}
      <div className="mt-8">
        {isError ? (
          <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {t('properties.loadError')}
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
            title={t(isSale ? 'properties.saleEmptyTitle' : 'properties.emptyTitle')}
            description={t('properties.emptyDescription')}
            action={
              chips.length > 0 ? (
                <Button variant="secondary" onClick={() => setSearchParams(new URLSearchParams())}>
                  {t('properties.clearFilters')}
                </Button>
              ) : undefined
            }
          />
        ) : view === 'map' ? (
          // Sub-phase #3: mapData is its OWN query (see above), separate
          // from the grid's `data` - it only starts fetching once the
          // owner switches to this view, so it can still be loading here
          // even though the grid's `data` (checked above) already
          // resolved.
          mapData ? (
            <div className={`transition-opacity ${isMapFetching ? 'opacity-60' : ''}`}>
              <PropertiesMapView properties={mapData.data} />
            </div>
          ) : (
            <div className="flex h-[520px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
              {t('properties.mapLoading')}
            </div>
          )
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
                {/* The chevrons flip with the text: "previous" is on the
                    right in Darija. */}
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ChevronLeft className="size-4 rtl:rotate-180" />}
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  {t('properties.previous')}
                </Button>
                <span className="text-sm text-gray-500">
                  {t('properties.pageOf', {
                    current: data.meta.current_page,
                    last: data.meta.last_page,
                  })}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= data.meta.last_page}
                  onClick={() => goToPage(page + 1)}
                >
                  {t('properties.next')}
                  <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
