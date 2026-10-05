import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HeartOff, TriangleAlert } from 'lucide-react'
import { useFavorites } from '@/features/favorites/useFavorites'
import PropertyCard from '@/components/properties/PropertyCard'
import { Card, EmptyState, Pagination, Skeleton, buttonClasses } from '@/components/ui'

/**
 * The current user's saved properties, same paginated-grid pattern as
 * PropertiesPage. Reachable only when logged in (router.tsx wraps it in
 * ProtectedRoute).
 */
function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2.5 h-3.5 w-1/2" />
        <Skeleton className="mt-4 h-5 w-2/5" />
      </div>
    </div>
  )
}

export default function FavoritesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isError, isFetching } = useFavorites(page)

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('favorites.title')}</h1>
      {data && (
        <p className="mt-1 text-sm text-gray-500">
          {t('favorites.count', { n: data.meta.total })}
        </p>
      )}

      <div className="mt-6">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            {t('favorites.loadError')}
          </Card>
        ) : !data ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={<HeartOff className="size-6" />}
            title={t('favorites.emptyTitle')}
            description={t('favorites.emptyDescription')}
            action={
              <Link to="/properties" className={buttonClasses()}>
                {t('reservations.browse')}
              </Link>
            }
          />
        ) : (
          <>
            <div
              className={`grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}
            >
              {data.data.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
          </>
        )}
      </div>
    </main>
  )
}
