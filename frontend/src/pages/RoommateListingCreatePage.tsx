import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import RoommateListingForm from '@/components/roommateListings/RoommateListingForm'
import RoommateListingImageStager from '@/components/roommateListings/RoommateListingImageStager'
import { useCreateRoommateListing } from '@/features/roommateListings/useRoommateListings'
import { roommateListingsApi } from '@/features/roommateListings/roommateListingsApi'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import type { RoommateListingFormPayload } from '@/features/roommateListings/roommateListingsApi'

/**
 * /owner/roommates/new - a brand new post always starts as a draft (see
 * RoommateListingService::create). Unlike PropertyCreatePage, photos are
 * picked here (staged in memory via RoommateListingImageStager - no
 * upload yet, there's no id to upload to) and sent right after the post
 * is created, via roommateListingsApi.uploadRoommateListingImages called
 * directly. If that upload fails, the post itself still exists (it was
 * created successfully) - we carry the error along to the edit page
 * rather than losing it, since that's where photos can be retried.
 */
export default function RoommateListingCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateRoommateListing()
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)

  function handleSubmit(payload: RoommateListingFormPayload) {
    createMutation.mutate(payload, {
      onSuccess: async (listing) => {
        if (pendingFiles.length === 0) {
          navigate(`/owner/roommates/${listing.id}/edit`)
          return
        }

        setIsUploadingPhotos(true)
        try {
          await roommateListingsApi.uploadRoommateListingImages(listing.id, pendingFiles)
          navigate(`/owner/roommates/${listing.id}/edit`)
        } catch (error) {
          navigate(`/owner/roommates/${listing.id}/edit`, {
            state: { photoUploadError: getErrorMessage(error) },
          })
        }
      },
    })
  }

  return (
    <>
      <Link
        to="/owner/roommates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('roommateEdit.back')}
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{t('roommateEdit.newTitle')}</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">{t('roommateEdit.newSubtitle')}</p>

      <RoommateListingForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || isUploadingPhotos}
        submitLabel={t('roommateEdit.create')}
        validationErrors={getValidationErrors(createMutation.error)}
        generalError={
          createMutation.isError && !getValidationErrors(createMutation.error)
            ? getErrorMessage(createMutation.error)
            : undefined
        }
      />

      <div className="mt-5">
        <RoommateListingImageStager files={pendingFiles} onChange={setPendingFiles} />
      </div>
    </>
  )
}
