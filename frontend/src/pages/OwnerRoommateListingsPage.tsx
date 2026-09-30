import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, HeartHandshake, ImageOff, Pencil, Plus, TriangleAlert } from 'lucide-react'
import {
  useOwnRoommateListings,
  usePublishRoommateListing,
  useUnpublishRoommateListing,
} from '@/features/roommateListings/useRoommateListings'
import { formatMad } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'
import { Badge, Button, Card, EmptyState, Skeleton, buttonClasses, useToast } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import type { RoommateListing, RoommateListingStatusValue, RoommateListingType } from '@/types/roommateListing'

const STATUS_LABELS: Record<RoommateListingStatusValue, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  archived: 'Archivé',
}

const STATUS_TONES: Record<RoommateListingStatusValue, BadgeTone> = {
  draft: 'slate',
  published: 'green',
  archived: 'slate',
}

const TYPE_LABELS: Record<RoommateListingType, string> = {
  offer: 'Offre',
  request: 'Recherche',
}

/**
 * /owner/roommates - every roommate post the current user has made, any
 * status (see RoommateListingController::mine()). No publication fee here
 * unlike OwnerPropertiesPage - roommate posts are exempt (confirmed
 * decision), so publish is a plain toggle, no "Payer" branch. No
 * "suspended" state either: a roommate post only has draft/published/
 * archived, and there is no unarchive action yet, so an archived post
 * just shows a static badge - same treatment as a suspended property.
 */
export default function OwnerRoommateListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { showToast } = useToast()
  const { data, isError, error } = useOwnRoommateListings(page)
  const publishMutation = usePublishRoommateListing()
  const unpublishMutation = useUnpublishRoommateListing()

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  function isMutating(listing: RoommateListing) {
    return (
      (publishMutation.isPending && publishMutation.variables === listing.id) ||
      (unpublishMutation.isPending && unpublishMutation.variables === listing.id)
    )
  }

  function StatusAction({ listing }: { listing: RoommateListing }) {
    if (listing.status === 'archived') {
      return (
        <span className="text-xs text-gray-400" title="Seul un administrateur peut lever une archive">
          Archivé
        </span>
      )
    }

    if (listing.status === 'published') {
      return (
        <Button
          size="sm"
          variant="secondary"
          disabled={isMutating(listing)}
          onClick={() =>
            unpublishMutation.mutate(listing.id, {
              onSuccess: () => showToast('success', `"${listing.title}" n'est plus visible publiquement.`),
            })
          }
        >
          {isMutating(listing) ? '...' : 'Dépublier'}
        </Button>
      )
    }

    return (
      <Button
        size="sm"
        disabled={isMutating(listing)}
        onClick={() =>
          publishMutation.mutate(listing.id, {
            onSuccess: () => showToast('success', `"${listing.title}" est maintenant publié.`),
          })
        }
      >
        {isMutating(listing) ? '...' : 'Publier'}
      </Button>
    )
  }

  function Thumb({ listing }: { listing: RoommateListing }) {
    const cover = listing.images.find((image) => image.is_cover) ?? listing.images[0] ?? null
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

  const mutationError = publishMutation.error ?? unpublishMutation.error

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mes colocations</h1>
          {data && (
            <p className="mt-1 text-sm text-gray-500">
              {data.meta.total} post{data.meta.total > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link to="/owner/roommates/new" className={buttonClasses({ size: 'sm', className: 'lg:hidden' })}>
          <Plus className="size-4" aria-hidden />
          Ajouter
        </Link>
      </div>

      {mutationError && (
        <Card className="mt-4 flex items-start gap-3 border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {getErrorMessage(mutationError)}
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
            icon={<HeartHandshake className="size-6" />}
            title="Aucun post pour le moment"
            description="Publiez une annonce pour trouver un colocataire ou une place à partager."
            action={
              <Link to="/owner/roommates/new" className={buttonClasses()}>
                <Plus className="size-4" aria-hidden />
                Ajouter un post
              </Link>
            }
          />
        ) : (
          <>
            {/* Desktop: a real table. Mobile: the same rows stacked as
                cards - same split as OwnerPropertiesPage. */}
            <Card className="hidden overflow-hidden p-0 lg:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col />
                  <col className="w-24" />
                  <col className="w-28" />
                  <col className="w-32" />
                  <col className="w-40" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    {['Post', 'Type', 'Ville', 'Statut', ''].map((heading) => (
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
                  {data.data.map((listing) => (
                    <tr
                      key={listing.id}
                      className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb listing={listing} />
                          <div className="min-w-0">
                            <Link
                              to={`/roommates/${listing.id}`}
                              title={listing.title}
                              className="block truncate font-medium text-gray-900 transition hover:text-brand-600"
                            >
                              {listing.title}
                            </Link>
                            {listing.price_per_person && (
                              <p className="text-xs text-gray-500">
                                {formatMad(Number(listing.price_per_person))} / personne
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{TYPE_LABELS[listing.type]}</td>
                      <td className="truncate px-4 py-3 text-sm text-gray-600">{listing.city}</td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONES[listing.status]}>{STATUS_LABELS[listing.status]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/owner/roommates/${listing.id}/edit`}
                            aria-label={`Modifier ${listing.title}`}
                            title="Modifier"
                            className={buttonClasses({
                              variant: 'secondary',
                              size: 'sm',
                              className: 'px-2.5',
                            })}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </Link>
                          <StatusAction listing={listing} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="space-y-3 lg:hidden">
              {data.data.map((listing) => (
                <Card key={listing.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Thumb listing={listing} />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/roommates/${listing.id}`}
                        className="block truncate font-medium text-gray-900"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {TYPE_LABELS[listing.type]} · {listing.city}
                      </p>
                      {listing.price_per_person && (
                        <p className="text-sm text-gray-600">
                          {formatMad(Number(listing.price_per_person))} / personne
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge tone={STATUS_TONES[listing.status]}>{STATUS_LABELS[listing.status]}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                    <Link
                      to={`/owner/roommates/${listing.id}/edit`}
                      className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                    >
                      <Pencil className="size-4" aria-hidden />
                      Modifier
                    </Link>
                    <StatusAction listing={listing} />
                  </div>
                </Card>
              ))}
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
