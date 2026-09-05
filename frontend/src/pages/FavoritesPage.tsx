import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useFavorites } from '@/features/favorites/useFavorites'
import PropertyCard from '@/components/properties/PropertyCard'

/**
 * The current user's saved properties, same paginated-grid pattern as
 * PropertiesPage. Reachable only when logged in (see router.tsx,
 * wrapped in ProtectedRoute).
 */
export default function FavoritesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isLoading, isError, isFetching } = useFavorites(page)

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-brand-700">Mes favoris</h1>

      {isLoading && <p className="text-gray-500">Chargement...</p>}

      {isError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          Impossible de charger vos favoris.
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="text-gray-500">
          Vous n'avez pas encore de favoris.{' '}
          <Link to="/properties" className="text-brand-600 hover:underline">
            Parcourir les propriétés
          </Link>
        </p>
      )}

      {data && data.data.length > 0 && (
        <>
          <div
            className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}
          >
            {data.data.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-500">
              Page {data.meta.current_page} / {data.meta.last_page}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= data.meta.last_page}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </main>
  )
}
