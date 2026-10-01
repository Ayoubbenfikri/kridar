import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  Map as MapIcon,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import RoommateListingCard from '@/components/roommateListings/RoommateListingCard'
import RoommateListingFilters from '@/components/roommateListings/RoommateListingFilters'
import type { RoommateFilterValues } from '@/components/roommateListings/RoommateListingFilters'
import RoommateListingsMapView from '@/components/map/RoommateListingsMapView'
import { useRoommateListings } from '@/features/roommateListings/useRoommateListings'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { RoommateListingType } from '@/types/roommateListing'

// The two post types are shown as separate tabs (see TYPE_TABS below), not
// mixed in one list with a "both" option — browsing "has a place" and
// "looking for a place" posts together made it hard to tell which was
// which, so the page now always shows exactly one at a time.
const TYPE_TABS: Array<{ type: RoommateListingType; icon: typeof Home }> = [
  { type: 'offer', icon: Home },
  { type: 'request', icon: Search },
]

function RoommateCardSkeleton() {
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
 * /roommates — same shape as PropertiesPage: the URL is the single
 * source of truth for every filter, so the query reads it, the filter
 * form writes to it, and Back walks through past searches for free.
 *
 * No amenities section here — not a field on this model. It DOES have a
 * list/map toggle now (RoommateListingsMapView, its own component — see
 * that file's docblock for why it isn't shared with PropertiesMapView).
 */
export default function RoommateListingsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')

  const get = (key: string) => searchParams.get(key) ?? ''
  const page = Number(get('page') || '1')

  // Always exactly one type — there is no "both" view anymore (see
  // TYPE_TABS above). An unset or garbage ?type= (a fresh /roommates
  // link, or someone hand-editing the URL) falls back to 'offer' rather
  // than erroring or showing nothing.
  const type: RoommateListingType = get('type') === 'request' ? 'request' : 'offer'

  const query = {
    page: page > 1 ? page : undefined,
    q: get('q') || undefined,
    city: get('city') || undefined,
    type,
    min_price: get('min_price') ? Number(get('min_price')) : undefined,
    max_price: get('max_price') ? Number(get('max_price')) : undefined,
    beds: get('beds') ? Number(get('beds')) : undefined,
    bedrooms: get('bedrooms') ? Number(get('bedrooms')) : undefined,
    furnished: get('furnished') ? get('furnished') === '1' : undefined,
    available_by: get('available_by') || undefined,
  }

  const { data, isError, isFetching } = useRoommateListings(query)
  const listings = data?.data ?? []

  // Map view: a SEPARATE query, only fetched once the visitor actually
  // switches to it, using the same active filters but its own per_page
  // (the backend's max) and no page number — the map wants every
  // matching result it can get, not one grid page. Same split as
  // PropertiesPage's mapQuery/mapData, kept apart from `query`/`data`
  // above so the grid's own pagination is unaffected.
  const mapQuery = { ...query, page: undefined, per_page: 50 }
  const { data: mapData, isFetching: isMapFetching } = useRoommateListings(mapQuery, {
    enabled: view === 'map',
  })

  const filterValues: RoommateFilterValues = {
    min_price: get('min_price'),
    max_price: get('max_price'),
    beds: get('beds'),
    bedrooms: get('bedrooms'),
    furnished: get('furnished'),
    available_by: get('available_by'),
  }

  /** Rewrites the URL, always dropping empty values and resetting to page 1. */
  function applyFilters(next: RoommateFilterValues) {
    const params = new URLSearchParams()
    if (get('q')) params.set('q', get('q'))
    if (get('city')) params.set('city', get('city'))
    params.set('type', type)

    for (const [key, raw] of Object.entries(next)) {
      if (raw) params.set(key, raw)
    }

    setSearchParams(params)
    setShowFilters(false)
  }

  // Switching tabs is a page switch, not a filter tweak — keeps the
  // search term and city, but drops price/beds/bedrooms/furnished/date:
  // those read as "offer" filters (an empty "request" post has no
  // bedrooms or furnished value), so carrying them over into the other
  // tab would silently hide everything there instead of showing results.
  function switchType(nextType: RoommateListingType) {
    const params = new URLSearchParams()
    if (get('q')) params.set('q', get('q'))
    if (get('city')) params.set('city', get('city'))
    params.set('type', nextType)
    setSearchParams(params)

    // "Looking for a place" posts never have coordinates (the form only
    // shows the map picker for "offer"), so there is nothing to put on a
    // map there — drop back to the list view rather than switching tabs
    // into an always-empty map.
    if (nextType === 'request') setView('list')
  }

  function removeParam(key: string) {
    const params = new URLSearchParams(searchParams)
    params.delete(key)
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

  const chips: Array<{ key: string; label: string }> = []
  if (get('q')) chips.push({ key: 'q', label: `"${get('q')}"` })
  if (get('city')) chips.push({ key: 'city', label: get('city') })
  if (get('min_price'))
    chips.push({
      key: 'min_price',
      label: t('roommates.chipMin', { value: get('min_price'), currency: t('common.currency') }),
    })
  if (get('max_price'))
    chips.push({
      key: 'max_price',
      label: t('roommates.chipMax', { value: get('max_price'), currency: t('common.currency') }),
    })
  if (get('beds')) chips.push({ key: 'beds', label: t('roommates.chipBeds', { n: get('beds') }) })
  if (get('bedrooms'))
    chips.push({ key: 'bedrooms', label: t('roommates.chipBedrooms', { n: get('bedrooms') }) })
  if (get('furnished') === '1') chips.push({ key: 'furnished', label: t('roommates.chipFurnished') })
  if (get('available_by'))
    chips.push({ key: 'available_by', label: t('roommates.chipAvailableBy', { date: get('available_by') }) })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Helmet>
        <title>Colocations et logements partagés au Maroc — Krihouse</title>
        <meta
          name="description"
          content="Trouvez un colocataire ou un logement à partager au Maroc, avec filtres par ville, prix et type d'annonce."
        />
      </Helmet>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('roommates.title')}</h1>
      <p className="mt-1.5 text-gray-500">
        {isError
          ? t('roommates.serverDown')
          : data
            ? t('roommates.available', { n: data.meta.total })
            : t('roommates.loading')}
      </p>

      {/* Offer vs request: two separate pages behind one URL (?type=),
          never a mixed list — see the TYPE_TABS comment above. */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TYPE_TABS.map(({ type: tabType, icon: Icon }) => {
          const isActive = type === tabType
          return (
            <button
              key={tabType}
              type="button"
              aria-pressed={isActive}
              onClick={() => switchType(tabType)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-4 text-start transition',
                isActive
                  ? 'border-brand-500 bg-brand-50 ring-[3px] ring-brand-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  isActive ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  isActive ? 'text-brand-900' : 'text-gray-900',
                )}
              >
                {t(`roommateType.${tabType}`)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 start-3.5 size-4.5 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={get('q')}
            key={get('q')}
            placeholder={t('roommates.searchPlaceholder')}
            aria-label={t('roommates.searchLabel')}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pe-3.5 ps-10.5 text-[15px] transition hover:border-gray-300 focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/20 focus:outline-none"
          />
        </form>

        <Button
          variant="secondary"
          icon={<SlidersHorizontal className="size-4" />}
          onClick={() => setShowFilters((open) => !open)}
          aria-expanded={showFilters}
        >
          {t('roommates.filters')}
          {chips.length > 0 && (
            <span className="ms-0.5 flex size-5 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {chips.length}
            </span>
          )}
        </Button>

        {/* Same segmented list/map control as PropertiesPage — but only
            for "offer" posts. "Looking for a place" posts never carry a
            saved position, so a map there would just always be empty;
            simpler to not offer that view at all than to show it and let
            people wonder why it's blank. */}
        {type === 'offer' && (
          <div className="flex shrink-0 rounded-lg border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="size-4" aria-hidden />
              {t('roommates.viewList')}
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === 'map' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <MapIcon className="size-4" aria-hidden />
              {t('roommates.viewMap')}
            </button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="mt-4">
          <RoommateListingFilters
            value={filterValues}
            onApply={applyFilters}
            onReset={() => {
              const params = new URLSearchParams()
              if (get('q')) params.set('q', get('q'))
              params.set('type', type)
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
              key={chip.key}
              type="button"
              onClick={() => removeParam(chip.key)}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 py-1 pe-2 ps-3 text-sm font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
            >
              {chip.label}
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">{t('roommates.removeFilter')}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSearchParams(new URLSearchParams({ type }))}
            className="text-sm font-medium text-gray-500 underline underline-offset-2 transition hover:text-gray-900"
          >
            {t('roommates.clearAll')}
          </button>
        </div>
      )}

      <div className="mt-8">
        {isError ? (
          <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {t('roommates.loadError')}
          </Card>
        ) : !data ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <RoommateCardSkeleton key={index} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title={t('roommates.emptyTitle')}
            description={t('roommates.emptyDescription')}
            action={
              chips.length > 0 ? (
                <Button
                  variant="secondary"
                  onClick={() => setSearchParams(new URLSearchParams({ type }))}
                >
                  {t('roommates.clearFilters')}
                </Button>
              ) : undefined
            }
          />
        ) : view === 'map' && type === 'offer' ? (
          // Its own query (mapData, see above) — only starts fetching
          // once the visitor switches to this view, so it can still be
          // loading here even though the grid's `data` already resolved.
          mapData ? (
            <div className={`transition-opacity ${isMapFetching ? 'opacity-60' : ''}`}>
              <RoommateListingsMapView listings={mapData.data} />
            </div>
          ) : (
            <div className="flex h-[520px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
              {t('roommates.mapLoading')}
            </div>
          )
        ) : (
          <>
            <div
              className={`grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}
            >
              {listings.map((listing) => (
                <RoommateListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {data.meta.last_page > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ChevronLeft className="size-4 rtl:rotate-180" />}
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  {t('roommates.previous')}
                </Button>
                <span className="text-sm text-gray-500">
                  {t('roommates.pageOf', {
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
                  {t('roommates.next')}
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
