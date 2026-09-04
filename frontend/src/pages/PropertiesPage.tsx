import { useSearchParams } from 'react-router-dom'
import { useProperties } from '@/features/properties/useProperties'
import PropertyCard from '@/components/properties/PropertyCard'

/**
 * Minimal listing page (Phase 16, light pass) — just published
 * properties, newest first, paginated. Search/filters are the full
 * Phase 16 that comes back once the backend-plus-frontend pairing
 * resumes from Phase 9 onward.
 */
export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isLoading, isError, isFetching } = useProperties(page)

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-brand-700">Toutes les propriétés</h1>

      {isLoading && <p className="text-gray-500">Chargement...</p>}

      {isError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          Impossible de charger les propriétés.
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="text-gray-500">Aucune propriété publiée pour le moment.</p>
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
