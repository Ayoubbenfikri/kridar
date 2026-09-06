import { useNavigate } from 'react-router-dom'
import PropertyForm from '@/components/properties/PropertyForm'
import { useCreateProperty } from '@/features/properties/useProperties'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import type { PropertyFormPayload } from '@/features/properties/propertiesApi'

/**
 * /owner/properties/new — a brand new property always starts as a
 * draft (see PropertyController::store). Photos can only be added
 * once the property exists, so on success we redirect straight to its
 * edit page rather than showing an image section here.
 */
export default function PropertyCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateProperty()

  function handleSubmit(payload: PropertyFormPayload) {
    createMutation.mutate(payload, {
      onSuccess: (property) => {
        navigate(`/owner/properties/${property.id}/edit`)
      },
    })
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-brand-700">Nouvelle propriete</h1>
      <p className="mb-6 text-sm text-gray-500">
        Elle sera creee en brouillon. Tu pourras ajouter des photos juste apres, puis la publier depuis "Mes
        proprietes".
      </p>

      <PropertyForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Creer la propriete"
        validationErrors={getValidationErrors(createMutation.error)}
        generalError={
          createMutation.isError && !getValidationErrors(createMutation.error)
            ? getErrorMessage(createMutation.error)
            : undefined
        }
      />
    </main>
  )
}
