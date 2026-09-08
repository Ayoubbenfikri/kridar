import { Link, useSearchParams } from 'react-router-dom'
import { Building2, ChevronLeft, ChevronRight, ImageOff, Pencil, Plus, TriangleAlert } from 'lucide-react'
import { useOwnerProperties, usePublishProperty, useUnpublishProperty } from '@/features/owner/useOwner'
import { formatMad, primaryPrice } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'
import { Badge, Button, Card, EmptyState, Skeleton, buttonClasses, useToast } from '@/components/ui'
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
 * /owner/properties - every property the current user owns, any status
 * (see EloquentPropertyRepository::paginateForOwner). Publish and
 * unpublish call the same endpoints as everywhere else (PropertyPolicy
 * checks ownership); a suspended property gets no publish button, since
 * only an admin can lift a suspension (PropertyService::publish()).
 */
export default function OwnerPropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { showToast } = useToast()
  const { data, isError, error } = useOwnerProperties(page)
  const publishMutation = usePublishProperty()
  const unpublishMutation = useUnpublishProperty()

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  function isMutating(property: Property) {
    return (
      (publishMutation.isPending && publishMutation.variables === property.id) ||
      (unpublishMutation.isPending && unpublishMutation.variables === property.id)
    )
  }

  /** The publish/unpublish control for one property. */
  function StatusAction({ property, compact }: { property: Property; compact?: boolean }) {
    if (property.status === 'suspended') {
      return (
        <span className="text-xs text-gray-400" title="Seul un administrateur peut lever une suspension">
          {compact ? 'Suspendue' : 'Suspendue par un admin'}
        </span>
      )
    }

    return property.status === 'published' ? (
      <Button
        size="sm"
        variant="secondary"
        disabled={isMutating(property)}
        onClick={() =>
          unpublishMutation.mutate(property.id, {
            onSuccess: () => showToast('success', `"${property.title}" n'est plus visible publiquement.`),
          })
        }
      >
        {isMutating(property) ? '...' : 'Dépublier'}
      </Button>
    ) : (
      <Button
        size="sm"
        disabled={isMutating(property)}
        onClick={() =>
          publishMutation.mutate(property.id, {
            onSuccess: () => showToast('success', `"${property.title}" est maintenant publiee.`),
          })
        }
      >
        {isMutating(property) ? '...' : 'Publier'}
      </Button>
    )
  }

  function Thumb({ property }: { property: Property }) {
    const cover = property.images.find((image) => image.is_cover) ?? property.images[0] ?? null
    return (
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {cover ? (
          <img src={cover.url} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-gray-400">
            <ImageOff className="size-4" aria-hidden />
          </span>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mes propriétés</h1>
          {data && (
            <p className="mt-1 text-sm text-gray-500">
              {data.meta.total} propriété{data.meta.total > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link to="/owner/properties/new" className={buttonClasses({ size: 'sm', className: 'lg:hidden' })}>
          <Plus className="size-4" aria-hidden />
          Ajouter
        </Link>
      </div>

      {(publishMutation.isError || unpublishMutation.isError) && (
        <Card className="mt-4 flex items-start gap-3 border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {getErrorMessage(publishMutation.error ?? unpublishMutation.error)}
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
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-6" />}
            title="Aucune propriété pour le moment"
            description="Publiez votre premier logement pour commencer à recevoir des réservations."
            action={
              <Link to="/owner/properties/new" className={buttonClasses()}>
                <Plus className="size-4" aria-hidden />
                Ajouter une propriété
              </Link>
            }
          />
        ) : (
          <>
            {/* Desktop: a real table. Mobile: the same rows stacked as
                cards, because a 5-column table cannot shrink honestly. */}
            <Card className="hidden overflow-hidden p-0 lg:block">
              {/* table-fixed + fixed column widths: columns no longer size
                  themselves to their content, so a long title is truncated
                  with an ellipsis instead of widening the table and forcing
                  a horizontal scrollbar. */}
              <table className="w-full table-fixed">
                <colgroup>
                  <col />
                  <col className="w-28" />
                  <col className="w-36" />
                  <col className="w-28" />
                  <col className="w-32" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    {['Propriété', 'Ville', 'Prix', 'Statut', ''].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-500 uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((property) => {
                    const price = primaryPrice(property)
                    return (
                      <tr
                        key={property.id}
                        className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Thumb property={property} />
                            <div className="min-w-0">
                              <Link
                                to={`/properties/${property.id}`}
                                title={property.title}
                                className="block truncate font-medium text-gray-900 transition hover:text-brand-600"
                              >
                                {property.title}
                              </Link>
                              <p className="text-xs text-gray-500">
                                {property.bedrooms} ch. · {property.bathrooms} sdb
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="truncate px-4 py-3 text-sm text-gray-600">{property.city}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                          {price ? `${formatMad(price.amount)} / ${price.unit}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={STATUS_TONES[property.status]}>
                            {STATUS_LABELS[property.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/owner/properties/${property.id}/edit`}
                              aria-label={`Modifier ${property.title}`}
                              title="Modifier"
                              className={buttonClasses({
                                variant: 'secondary',
                                size: 'sm',
                                className: 'px-2.5',
                              })}
                            >
                              <Pencil className="size-4" aria-hidden />
                            </Link>
                            <StatusAction property={property} compact />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>

            <div className="space-y-3 lg:hidden">
              {data.data.map((property) => {
                const price = primaryPrice(property)
                return (
                  <Card key={property.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Thumb property={property} />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/properties/${property.id}`}
                          className="block truncate font-medium text-gray-900"
                        >
                          {property.title}
                        </Link>
                        <p className="text-sm text-gray-500">{property.city}</p>
                        {price && (
                          <p className="text-sm text-gray-600">
                            {formatMad(price.amount)} / {price.unit}
                          </p>
                        )}
                      </div>
                      <Badge tone={STATUS_TONES[property.status]}>{STATUS_LABELS[property.status]}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                      <Link
                        to={`/owner/properties/${property.id}/edit`}
                        className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                      >
                        <Pencil className="size-4" aria-hidden />
                        Modifier
                      </Link>
                      <StatusAction property={property} />
                    </div>
                  </Card>
                )
              })}
            </div>

            {data.meta.last_page > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ChevronLeft className="size-4" />}
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Précédent
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
    </>
  )
}
