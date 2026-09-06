import { Link, useSearchParams } from 'react-router-dom'
import { useOwnerProperties, usePublishProperty, useUnpublishProperty } from '@/features/owner/useOwner'
import { formatMad, primaryPrice } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'
import type { PropertyStatusValue } from '@/types/property'

const STATUS_LABELS: Record<PropertyStatusValue, string> = {
  draft: 'Brouillon',
  pending_review: 'En revision',
  published: 'Publiee',
  suspended: 'Suspendue',
  archived: 'Archivee',
}

const STATUS_CLASSES: Record<PropertyStatusValue, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-500',
}

/**
 * /owner/properties — every property the current user owns, any status
 * (see EloquentPropertyRepository::paginateForOwner). Publish/unpublish
 * here call the same endpoints as everywhere else (PropertyPolicy checks
 * ownership) — a suspended property's "Publier" button is hidden since
 * only an admin can lift a suspension (PropertyService::publish()).
 */
export default function OwnerPropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isLoading, isError, error } = useOwnerProperties(page)
  const publishMutation = usePublishProperty()
  const unpublishMutation = useUnpublishProperty()

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-700">Mes proprietes</h1>
        <Link
          to="/owner/properties/new"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition hover:scale-[1.02] hover:bg-brand-700 active:scale-[0.98]"
        >
          Ajouter une propriete
        </Link>
      </div>

      {isLoading && <p className="text-gray-500">Chargement...</p>}

      {isError && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          {getErrorMessage(error)}
        </div>
      )}

      {data && data.data.length === 0 && <p className="text-gray-500">Vous n'avez pas encore de propriete.</p>}

      {data && data.data.length > 0 && (
        <>
          <div className="space-y-3">
            {data.data.map((property) => {
              const cover = property.images[0]?.url ?? null
              const price = primaryPrice(property)
              const isMutatingThis =
                (publishMutation.isPending && publishMutation.variables === property.id) ||
                (unpublishMutation.isPending && unpublishMutation.variables === property.id)

              return (
                <div key={property.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
                    {cover ? (
                      <img src={cover} alt={property.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link to={`/properties/${property.id}`} className="truncate font-medium text-gray-800 transition hover:text-brand-700">
                      {property.title}
                    </Link>
                    <p className="text-sm text-gray-500">{property.city}</p>
                    {price && (
                      <p className="text-sm text-gray-600">
                        {formatMad(price.amount)} / {price.unit}
                      </p>
                    )}
                  </div>

                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASSES[property.status]}`}>
                    {STATUS_LABELS[property.status]}
                  </span>

                  <Link
                    to={`/owner/properties/${property.id}/edit`}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition hover:bg-gray-50"
                  >
                    Modifier
                  </Link>

                  {property.status === 'suspended' ? (
                    <span className="shrink-0 text-xs text-gray-400">Suspendue par un admin</span>
                  ) : property.status === 'published' ? (
                    <button
                      type="button"
                      onClick={() => unpublishMutation.mutate(property.id)}
                      disabled={isMutatingThis}
                      className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isMutatingThis ? '...' : 'Depublier'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => publishMutation.mutate(property.id)}
                      disabled={isMutatingThis}
                      className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition hover:scale-[1.02] hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isMutatingThis ? '...' : 'Publier'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {(publishMutation.isError || unpublishMutation.isError) && (
            <p className="mt-3 text-sm text-red-600">
              {getErrorMessage(publishMutation.error ?? unpublishMutation.error)}
            </p>
          )}

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Precedent
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
