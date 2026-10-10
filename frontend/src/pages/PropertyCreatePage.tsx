import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import PropertyForm from '@/components/properties/PropertyForm'
import PropertyImageStager from '@/components/properties/PropertyImageStager'
import { useCreateProperty } from '@/features/properties/useProperties'
import { propertiesApi } from '@/features/properties/propertiesApi'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import type { PropertyFormPayload } from '@/features/properties/propertiesApi'

/**
 * /owner/properties/new - a brand new property always starts as a
 * draft (see PropertyController::store). Photos are picked here (staged
 * in memory via PropertyImageStager - no upload yet, there's no id to
 * upload to) and sent right after the property is created, via
 * propertiesApi.uploadPropertyImages called directly. If that upload
 * fails, the property itself still exists (it was created successfully)
 * - we carry the error along to the edit page rather than losing it,
 * since that's where photos can be retried (PropertyImagesManager).
 * Same approach as RoommateListingCreatePage.
 */
export default function PropertyCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // /owner/properties/new?listing_type=sale opens the form on "Vendre".
  // Only a starting point: the chooser in the form still decides, and the
  // backend validates listing_type itself.
  const [searchParams] = useSearchParams()
  const defaultListingType = searchParams.get('listing_type') === 'sale' ? 'sale' : 'rent'
  const createMutation = useCreateProperty()
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)

  function handleSubmit(payload: PropertyFormPayload) {
    createMutation.mutate(payload, {
      onSuccess: async (property) => {
        if (pendingFiles.length === 0) {
          navigate(`/owner/properties/${property.id}/edit`)
          return
        }

        setIsUploadingPhotos(true)
        try {
          await propertiesApi.uploadPropertyImages(property.id, pendingFiles)
          navigate(`/owner/properties/${property.id}/edit`)
        } catch (error) {
          navigate(`/owner/properties/${property.id}/edit`, {
            state: { photoUploadError: getErrorMessage(error) },
          })
        }
      },
    })
  }

  return (
    <>
      <Link
        to="/owner/properties"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('owner.nav.properties')}
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{t('propertyEdit.newTitle')}</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        {t('propertyEdit.newSubtitle')}
      </p>

      <PropertyForm
        defaultListingType={defaultListingType}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || isUploadingPhotos}
        submitLabel={t('propertyEdit.create')}
        validationErrors={getValidationErrors(createMutation.error)}
        generalError={
          createMutation.isError && !getValidationErrors(createMutation.error)
            ? getErrorMessage(createMutation.error)
            : undefined
        }
      />

      <div className="mt-5">
        <PropertyImageStager files={pendingFiles} onChange={setPendingFiles} />
      </div>
    </>
  )
}
