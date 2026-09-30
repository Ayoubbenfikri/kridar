import { Link, useSearchParams } from 'react-router-dom'
import { Ban, Check, HeartHandshake, ImageOff, TriangleAlert } from 'lucide-react'
import {
  useAdminRoommateListings,
  useApproveRoommateListing,
  useSuspendRoommateListing,
} from '@/features/admin/useAdmin'
import { formatMad } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'
import { Badge, Button, Card, EmptyState, Pagination, Skeleton, useToast } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import type { RoommateListing, RoommateListingStatusValue, RoommateListingType } from '@/types/roommateListing'

const STATUS_LABELS: Record<RoommateListingStatusValue, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  suspended: 'Suspendu',
  archived: 'Archivé',
}

const STATUS_TONES: Record<RoommateListingStatusValue, BadgeTone> = {
  draft: 'slate',
  published: 'green',
  suspended: 'red',
  archived: 'slate',
}

const TYPE_LABELS: Record<RoommateListingType, string> = {
  offer: 'Offre',
  request: 'Recherche',
}

/**
 * Same defensive pattern as AdminPropertiesPage's Thumbnail: `images` only
 * exists on the JSON when the query eager-loaded the relation
 * (whenLoaded()), and AdminService::listRoommateListings() does load the
 * cover image — but this stays defensive rather than trusting that forever.
 */
function Thumbnail({ listing }: { listing: RoommateListing }) {
  const images = listing.images ?? []
  const cover = images.find((image) => image.is_cover) ?? images[0] ?? null

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

/**
 * /admin/roommate-listings - every roommate post, any status, any poster.
 * Same shape as AdminPropertiesPage — no filter/search parameter, same
 * "Approuver"/"Suspendre" pair. "Approuver" is the only way back to
 * Published for a suspended post (AdminService), hidden once already
 * published; "Suspendre" hidden once already suspended.
 */
export default function AdminRoommateListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { showToast } = useToast()
  const { data, isError, error, isFetching } = useAdminRoommateListings(page)
  const approveMutation = useApproveRoommateListing()
  const suspendMutation = useSuspendRoommateListing()

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function isMutating(listing: RoommateListing) {
    return (
      (approveMutation.isPending && approveMutation.variables === listing.id) ||
      (suspendMutation.isPending && suspendMutation.variables === listing.id)
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Colocations</h1>
      {data && (
        <p className="mt-1 text-sm text-gray-500">
          {data.meta.total} post{data.meta.total > 1 ? 's' : ''}, tous statuts confondus
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
          <EmptyState icon={<HeartHandshake className="size-6" />} title="Aucun post" />
        ) : (
          <>
            <div className={`space-y-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              {data.data.map((listing) => (
                <Card key={listing.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Thumbnail listing={listing} />
                      <div className="min-w-0">
                        <Link
                          to={`/roommates/${listing.id}`}
                          className="block truncate font-medium text-gray-900 transition hover:text-brand-600"
                        >
                          {listing.title}
                        </Link>
                        <p className="truncate text-sm text-gray-500">
                          {TYPE_LABELS[listing.type]} · {listing.city} ·{' '}
                          {listing.user?.name ?? 'Utilisateur supprimé'}
                          {listing.price_per_person && ` · ${formatMad(listing.price_per_person)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONES[listing.status]}>{STATUS_LABELS[listing.status]}</Badge>

                      {listing.status !== 'published' && (
                        <Button
                          size="sm"
                          icon={<Check className="size-4" />}
                          disabled={isMutating(listing)}
                          isLoading={approveMutation.isPending && approveMutation.variables === listing.id}
                          onClick={() =>
                            approveMutation.mutate(listing.id, {
                              onSuccess: () => showToast('success', `"${listing.title}" est publié.`),
                            })
                          }
                        >
                          Approuver
                        </Button>
                      )}

                      {listing.status !== 'suspended' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Ban className="size-4" />}
                          disabled={isMutating(listing)}
                          isLoading={suspendMutation.isPending && suspendMutation.variables === listing.id}
                          onClick={() =>
                            suspendMutation.mutate(listing.id, {
                              onSuccess: () => showToast('info', `"${listing.title}" est suspendu.`),
                            })
                          }
                        >
                          Suspendre
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
          </>
        )}
      </div>
    </>
  )
}
