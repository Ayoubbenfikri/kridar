import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, TriangleAlert, Trash2 } from 'lucide-react'
import PropertyForm from '@/components/properties/PropertyForm'
import PropertyImagesManager from '@/components/properties/PropertyImagesManager'
import { useDeleteProperty, useProperty, useUpdateProperty } from '@/features/properties/useProperties'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Card, Skeleton } from '@/components/ui'
import type { PropertyFormPayload } from '@/features/properties/propertiesApi'

/**
 * /owner/properties/:id/edit - reuses the same GET /properties/{id}
 * (and PropertyPolicy::view) already used by PropertyDetailsPage, so a
 * draft property is visible here to its owner even though it is not
 * publicly listed yet.
 */
export default function PropertyEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: property, isError, error } = useProperty(id)
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

  if (isError) {
    return (
      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
        {getErrorMessage(error)}
      </Card>
    )
  }

  if (!property) {
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
        to="/owner/properties"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mes propriétés
      </Link>

      <h1 className="mt-3 mb-6 text-2xl font-bold tracking-tight text-gray-900">{property.title}</h1>

      {updateMutation.isSuccess && (
        <Card className="mb-5 flex items-center gap-3 border-green-200 bg-green-50 p-3.5 text-sm text-green-800">
          <CheckCircle2 className="size-4.5 shrink-0" aria-hidden />
          Propriété mise à jour.
        </Card>
      )}

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

      <div className="mt-5">
        <PropertyImagesManager propertyId={property.id} images={property.images} />
      </div>

      <Card className="mt-5 border-red-200 p-5">
        <h2 className="font-semibold text-red-700">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-gray-600">
          La suppression est définitive et emporte les photos de la propriété.
        </p>

        {!confirmingDelete ? (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="size-4" />}
            className="mt-4"
            onClick={() => setConfirmingDelete(true)}
          >
            Supprimer cette propriété
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
