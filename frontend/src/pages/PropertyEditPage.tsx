import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PropertyForm from '@/components/properties/PropertyForm'
import PropertyImagesManager from '@/components/properties/PropertyImagesManager'
import { useDeleteProperty, useProperty, useUpdateProperty } from '@/features/properties/useProperties'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import type { PropertyFormPayload } from '@/features/properties/propertiesApi'

/**
 * /owner/properties/:id/edit — reuses the same GET /properties/{id}
 * (and PropertyPolicy::view) already used by PropertyDetailsPage, so a
 * draft property is visible here to its owner even though it's not
 * publicly listed yet.
 */
export default function PropertyEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: property, isLoading, isError, error } = useProperty(id)
  const updateMutation = useUpdateProperty()
  const deleteMutation = useDeleteProperty()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleSubmit(payload: PropertyFormPayload) {
    if (!property) return
    updateMutation.mutate({ propertyId: property.id, payload })
  }

  function handleDelete() {
    if (!property) return
    deleteMutation.mutate(property.id, {
      onSuccess: () => navigate('/owner/properties'),
    })
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-gray-500">Chargement...</p>
      </main>
    )
  }

  if (isError || !property) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          {getErrorMessage(error)}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="mb-6 text-2xl font-semibold text-brand-700">Modifier {property.title}</h1>

        <PropertyForm
          initialProperty={property}
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
        {updateMutation.isSuccess && <p className="mt-2 text-sm text-green-700">Propriete mise a jour.</p>}
      </div>

      <PropertyImagesManager propertyId={property.id} images={property.images} />

      <div className="rounded-lg border border-red-200 p-4">
        <h2 className="mb-2 font-semibold text-red-700">Zone dangereuse</h2>
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50"
          >
            Supprimer cette propriete
          </button>
        ) : (
          <div>
            <p className="mb-2 text-sm text-gray-700">
              Cette action est definitive (photos comprises). Confirmer la suppression ?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition hover:scale-[1.02] hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Oui, supprimer'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
            {deleteMutation.isError && (
              <p className="mt-2 text-sm text-red-600">{getErrorMessage(deleteMutation.error)}</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
