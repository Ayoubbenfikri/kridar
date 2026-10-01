import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, TriangleAlert, Trash2 } from 'lucide-react'
import RoommateListingForm from '@/components/roommateListings/RoommateListingForm'
import RoommateListingImagesManager from '@/components/roommateListings/RoommateListingImagesManager'
import {
  useDeleteRoommateListing,
  useRoommateListing,
  useUpdateRoommateListing,
} from '@/features/roommateListings/useRoommateListings'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Card, Skeleton } from '@/components/ui'
import type { RoommateListingFormPayload } from '@/features/roommateListings/roommateListingsApi'

/**
 * /owner/roommates/:id/edit - reuses the same GET /roommate-listings/{id}
 * (and RoommateListingPolicy::view) already used by
 * RoommateListingDetailsPage, so a draft post is visible here to its
 * poster even though it is not publicly listed yet. Same shape as
 * PropertyEditPage; publish/unpublish lives on the list page
 * (OwnerRoommateListingsPage), not here - same split as properties.
 */
export default function RoommateListingEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // Set by RoommateListingCreatePage when the post was created successfully
  // but the photos picked there failed to upload — the post itself is
  // fine, only the photo step needs a retry, which happens right below
  // via the normal RoommateListingImagesManager.
  const photoUploadError = (useLocation().state as { photoUploadError?: string } | null)
    ?.photoUploadError

  const { data: listing, isError, error } = useRoommateListing(id)
  const updateMutation = useUpdateRoommateListing()
  const deleteMutation = useDeleteRoommateListing()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleSubmit(payload: RoommateListingFormPayload) {
    if (!listing) return
    updateMutation.mutate({ id: listing.id, payload })
  }

  function handleDelete() {
    if (!listing) return
    deleteMutation.mutate(listing.id, {
      onSuccess: () => navigate('/owner/roommates'),
    })
  }

  if (isError) {
    return (
      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
        {getErrorMessage(error)}
      </Card>
    )
  }

  if (!listing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <Link
        to="/owner/roommates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mes colocations
      </Link>

      <h1 className="mt-3 mb-6 text-2xl font-bold tracking-tight text-gray-900">{listing.title}</h1>

      {updateMutation.isSuccess && (
        <Card className="mb-5 flex items-center gap-3 border-green-200 bg-green-50 p-3.5 text-sm text-green-800">
          <CheckCircle2 className="size-4.5 shrink-0" aria-hidden />
          Post mis à jour.
        </Card>
      )}

      <RoommateListingForm
        initialListing={listing}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitLabel="Enregistrer"
        validationErrors={getValidationErrors(updateMutation.error)}
        generalError={
          updateMutation.isError && !getValidationErrors(updateMutation.error)
            ? getErrorMessage(updateMutation.error)
            : undefined
        }
      />

      <div className="mt-5">
        {photoUploadError && (
          <Card className="mb-3 flex items-start gap-3 border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            <span>
              Le post a bien été créé, mais l'envoi des photos a échoué ({photoUploadError}).
              Réessayez ci-dessous.
            </span>
          </Card>
        )}
        <RoommateListingImagesManager listingId={listing.id} images={listing.images} />
      </div>

      <Card className="mt-5 border-red-200 p-5">
        <h2 className="font-semibold text-red-700">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-gray-600">
          La suppression est définitive et emporte les photos du post.
        </p>

        {!confirmingDelete ? (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="size-4" />}
            className="mt-4"
            onClick={() => setConfirmingDelete(true)}
          >
            Supprimer ce post
          </Button>
        ) : (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">Confirmer la suppression ?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteMutation.isPending}
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Oui, supprimer'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </Button>
            </div>
            {deleteMutation.isError && (
              <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {getErrorMessage(deleteMutation.error)}
              </p>
            )}
          </div>
        )}
      </Card>
    </>
  )
}
