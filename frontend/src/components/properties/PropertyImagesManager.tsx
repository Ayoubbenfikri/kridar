import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, TriangleAlert } from 'lucide-react'
import { useDeletePropertyImage, useUploadPropertyImages } from '@/features/properties/useProperties'
import { getErrorMessage } from '@/lib/apiErrors'
import { Card } from '@/components/ui'
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
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <ImagePlus className="size-4.5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold text-gray-900">Photos</h2>
          <p className="text-sm text-gray-500">
            La première photo ajoutée devient automatiquement la couverture.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
          >
            <img src={image.url} alt="" className="aspect-square w-full object-cover" />

            {image.is_cover && (
              <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-gray-900 backdrop-blur-sm">
                Couverture
              </span>
            )}

            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              disabled={deletingId === image.id}
              aria-label="Supprimer cette photo"
              className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-red-700 disabled:opacity-50"
            >
              {deletingId === image.id ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-4" aria-hidden />
              )}
            </button>
          </div>
        ))}

        {/* The upload control sits in the grid as the next "tile", so
            adding a photo happens where the photos already are. */}
        <label
          className={
            'flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700' +
            (uploadMutation.isPending ? ' pointer-events-none opacity-60' : '')
          }
        >
          {uploadMutation.isPending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-5" aria-hidden />
          )}
          <span className="text-xs font-medium">
            {uploadMutation.isPending ? 'Envoi...' : 'Ajouter'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFilesSelected}
            disabled={uploadMutation.isPending}
            className="sr-only"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        JPEG/PNG/WebP, 5 Mo maximum par photo, 10 photos au total.
      </p>

      {(uploadMutation.isError || deleteMutation.isError) && (
        <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {getErrorMessage(uploadMutation.error ?? deleteMutation.error)}
        </p>
      )}
    </Card>
  )
}
