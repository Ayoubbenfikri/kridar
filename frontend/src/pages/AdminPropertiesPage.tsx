import { Link, useSearchParams } from 'react-router-dom'
import { Ban, Building2, Check, ImageOff, TriangleAlert } from 'lucide-react'
import { useAdminProperties, useApproveProperty, useSuspendProperty } from '@/features/admin/useAdmin'
import { formatMad, primaryPrice } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'
import { Badge, Button, Card, EmptyState, Pagination, Skeleton, useToast } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import type { Property, PropertyStatusValue } from '@/types/property'

const STATUS_LABELS: Record<PropertyStatusValue, string> = {
  draft: 'Brouillon',
  pending_review: 'En revision',
  published: 'Publiée',
  suspended: 'Suspendue',
  archived: 'Archivée',
}

const STATUS_TONES: Record<PropertyStatusValue, BadgeTone> = {
  draft: 'slate',
  pending_review: 'amber',
  published: 'green',
  suspended: 'red',
  archived: 'slate',
}

/**
 * /admin/properties - every property, any status, any owner. Like
 * /admin/users, the endpoint accepts no filter or search parameter, so
 * this page does not pretend to offer one.
 *
 * "Approuver" publishes whatever the current status is - it is the only
 * way back to Published for a suspended listing (AdminService).
 */
export default function AdminPropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { showToast } = useToast()
  const { data, isError, error, isFetching } = useAdminProperties(page)
  const approveMutation = useApproveProperty()
  const suspendMutation = useSuspendProperty()

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function isMutating(property: Property) {
    return (
      (approveMutation.isPending && approveMutation.variables === property.id) ||
      (suspendMutation.isPending && suspendMutation.variables === property.id)
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Propriétés</h1>
      {data && (
        <p className="mt-1 text-sm text-gray-500">
          {data.meta.total} propriété{data.meta.total > 1 ? 's' : ''}, tous statuts confondus
        </p>
      )}

      {(approveMutation.isError || suspendMutation.isError) && (
        <Card className="mt-4 flex items-start gap-3 border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {getErrorMessage(approveMutation.error ?? suspendMutation.error)}
        </Card>
      )}

      <div className="mt-6">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            {getErrorMessage(error)}
          </Card>
        ) : !data ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState icon={<Building2 className="size-6" />} title="Aucune propriété" />
        ) : (
          <>
            <div className={`space-y-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              {data.data.map((property) => {
                const cover = property.images.find((image) => image.is_cover) ?? property.images[0] ?? null
                const price = primaryPrice(property)

                return (
                  <Card key={property.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {cover ? (
                            <img src={cover.url} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="flex size-full items-center justify-center text-gray-400">
                              <ImageOff className="size-4" aria-hidden />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/properties/${property.id}`}
                            className="block truncate font-medium text-gray-900 transition hover:text-brand-600"
                          >
                            {property.title}
                          </Link>
                          <p className="truncate text-sm text-gray-500">
                            {property.city} · {property.owner.name}
                            {price && ` · ${formatMad(price.amount)} / ${price.unit}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={STATUS_TONES[property.status]}>
                          {STATUS_LABELS[property.status]}
                        </Badge>

                        {property.status !== 'published' && (
                          <Button
                            size="sm"
                            icon={<Check className="size-4" />}
                            disabled={isMutating(property)}
                            isLoading={
                              approveMutation.isPending && approveMutation.variables === property.id
                            }
                            onClick={() =>
                              approveMutation.mutate(property.id, {
                                onSuccess: () => showToast('success', `"${property.title}" est publiee.`),
                              })
                            }
                          >
                            Approuver
                          </Button>
                        )}

                        {property.status !== 'suspended' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Ban className="size-4" />}
                            disabled={isMutating(property)}
                            isLoading={
                              suspendMutation.isPending && suspendMutation.variables === property.id
                            }
                            onClick={() =>
                              suspendMutation.mutate(property.id, {
                                onSuccess: () => showToast('info', `"${property.title}" est suspendue.`),
                              })
                            }
                          >
                            Suspendre
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
          </>
        )}
      </div>
    </>
  )
}
