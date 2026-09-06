import { useRef, useState } from 'react'
import { useDeletePropertyImage, useUploadPropertyImages } from '@/features/properties/useProperties'
import { getErrorMessage } from '@/lib/apiErrors'
import type { PropertyImage } from '@/types/property'

/**
 * Image grid + upload/delete for one property (edit mode only - a
 * property must already exist before it can have images, see
 * PropertyEditPage). There is no "set as cover" action: the backend
 * always makes the very first image the cover and auto-promotes the
 * next one when the cover is deleted (see PropertyImageService).
 */
export default function PropertyImagesManager({
  propertyId,
  images,
}: {
  propertyId: number
  images: PropertyImage[]
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadPropertyImages(propertyId)
  const deleteMutation = useDeletePropertyImage(propertyId)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    uploadMutation.mutate(Array.from(files), {
      onSettled: () => {
        // Reset so selecting the exact same file(s) again still fires onChange.
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
    })
  }

  function handleDelete(imageId: number) {
    setDeletingId(imageId)
    deleteMutation.mutate(imageId, { onSettled: () => setDeletingId(null) })
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-4 font-semibold text-gray-800">Photos</h2>

      {images.length === 0 && <p className="mb-4 text-sm text-gray-500">Aucune photo pour le moment.</p>}

      {images.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="relative overflow-hidden rounded-lg border border-gray-200">
              <img src={image.url} alt="" className="aspect-square w-full object-cover" />
              {image.is_cover && (
                <span className="absolute left-1 top-1 rounded bg-brand-600 px-2 py-0.5 text-xs text-white">
                  Couverture
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                disabled={deletingId === image.id}
                className="absolute bottom-1 right-1 rounded bg-white/90 px-2 py-1 text-xs text-red-700 transition hover:bg-white disabled:opacity-50"
              >
                {deletingId === image.id ? '...' : 'Supprimer'}
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="inline-block cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition hover:bg-gray-50">
        {uploadMutation.isPending ? 'Envoi...' : 'Ajouter des photos'}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFilesSelected}
          disabled={uploadMutation.isPending}
          className="hidden"
        />
      </label>
      <p className="mt-1 text-xs text-gray-500">JPEG/PNG/WebP, 5 Mo max par photo, 10 photos max au total.</p>

      {uploadMutation.isError && (
        <p className="mt-2 text-sm text-red-600">{getErrorMessage(uploadMutation.error)}</p>
      )}
      {deleteMutation.isError && (
        <p className="mt-2 text-sm text-red-600">{getErrorMessage(deleteMutation.error)}</p>
      )}
    </div>
  )
}
