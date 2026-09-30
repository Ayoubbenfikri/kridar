import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import RoommateListingForm from '@/components/roommateListings/RoommateListingForm'
import { useCreateRoommateListing } from '@/features/roommateListings/useRoommateListings'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import type { RoommateListingFormPayload } from '@/features/roommateListings/roommateListingsApi'

/**
 * /owner/roommates/new - a brand new post always starts as a draft (see
 * RoommateListingService::create). Photos can only be added once the
 * post exists, so on success we redirect straight to its edit page -
 * same flow as PropertyCreatePage.
 */
export default function RoommateListingCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateRoommateListing()

  function handleSubmit(payload: RoommateListingFormPayload) {
    createMutation.mutate(payload, {
      onSuccess: (listing) => {
        navigate(`/owner/roommates/${listing.id}/edit`)
      },
    })
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

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">Nouveau post</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        Il sera créé en brouillon. Vous pourrez ajouter des photos juste après, puis le publier.
      </p>

      <RoommateListingForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Créer le post"
        validationErrors={getValidationErrors(createMutation.error)}
        generalError={
          createMutation.isError && !getValidationErrors(createMutation.error)
            ? getErrorMessage(createMutation.error)
            : undefined
        }
      />
    </>
  )
}
