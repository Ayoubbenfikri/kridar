import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { ChevronLeft, ChevronRight, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import RoommateListingCard from '@/components/roommateListings/RoommateListingCard'
import RoommateListingFilters from '@/components/roommateListings/RoommateListingFilters'
import type { RoommateFilterValues } from '@/components/roommateListings/RoommateListingFilters'
import { useRoommateListings } from '@/features/roommateListings/useRoommateListings'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui'
import type { RoommateListingType } from '@/types/roommateListing'

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
 * No map view and no amenities section here — neither applies to a
 * roommate post (no lat/lng, no amenities table row).
 */
export default function RoommateListingsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const get = (key: string) => searchParams.get(key) ?? ''
  const page = Number(get('page') || '1')

  const query = {
    page: page > 1 ? page : undefined,
    q: get('q') || undefined,
    city: get('city') || undefined,
    type: (get('type') || undefined) as RoommateListingType | undefined,
    min_price: get('min_price') ? Number(get('min_price')) : undefined,
    max_price: get('max_price') ? Number(get('max_price')) : undefined,
    beds: get('beds') ? Number(get('beds')) : undefined,
    bedrooms: get('bedrooms') ? Number(get('bedrooms')) : undefined,
    furnished: get('furnished') ? get('furnished') === '1' : undefined,
    available_by: get('available_by') || undefined,
  }

  const { data, isError, isFetching } = useRoommateListings(query)
  const listings = data?.data ?? []

  const filterValues: RoommateFilterValues = {
    type: get('type'),
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

    for (const [key, raw] of Object.entries(next)) {
      if (raw) params.set(key, raw)
    }

    setSearchParams(params)
    setShowFilters(false)
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
  if (get('type')) chips.push({ key: 'type', label: t(`roommateType.${get('type')}`) })
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
      </div>

      {showFilters && (
        <div className="mt-4">
          <RoommateListingFilters
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
            onClick={() => setSearchParams(new URLSearchParams())}
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
                <Button variant="secondary" onClick={() => setSearchParams(new URLSearchParams())}>
                  {t('roommates.clearFilters')}
                </Button>
              ) : undefined
            }
          />
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
