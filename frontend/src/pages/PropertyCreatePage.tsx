import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PropertyForm from '@/components/properties/PropertyForm'
import { useCreateProperty } from '@/features/properties/useProperties'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import type { PropertyFormPayload } from '@/features/properties/propertiesApi'

/**
 * /owner/properties/new - a brand new property always starts as a
 * draft (see PropertyController::store). Photos can only be added once
 * the property exists, so on success we redirect straight to its edit
 * page rather than showing an image section here.
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
    <>
      <Link
        to="/owner/properties"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mes propriétés
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">Nouvelle propriété</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        Elle sera créée en brouillon. Vous pourrez ajouter des photos juste après, puis la publier.
      </p>

      <PropertyForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Créer la propriété"
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
