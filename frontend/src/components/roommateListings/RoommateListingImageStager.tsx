import { useEffect, useMemo, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Card } from '@/components/ui'

/**
 * Client-side-only image picker for the roommate listing CREATE page.
 * No upload happens here — POST /roommate-listings/{id}/images needs an
 * id, and there is no listing yet on this page. Files are staged in
 * memory (state owned by RoommateListingCreatePage) and previewed via
 * object URLs; the actual upload happens right after the create mutation
 * succeeds, via roommateListingsApi.uploadRoommateListingImages(id, files)
 * called directly (not the useUploadRoommateListingImages hook, which
 * needs an id at render time).
 *
 * Same visual language as RoommateListingImagesManager (edit mode) so the
 * create page doesn't feel like a stripped-down version of it — grid of
 * tiles + a dashed "add" tile, first photo marked as the future cover.
 */
export default function RoommateListingImageStager({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // One object URL per staged file. These are never garbage-collected on
  // their own, so every URL created here must be revoked once it's no
  // longer shown — on every files change, and on unmount.
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
  }, [previews])

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files
    if (!selected || selected.length === 0) return
    onChange([...files, ...Array.from(selected)])
    // Reset so selecting the exact same file(s) again still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index))
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
            Elles seront envoyées automatiquement dès la création du post. La première devient la
            couverture.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
          >
            <img src={previews[index]} alt="" className="aspect-square w-full object-cover" />

            {index === 0 && (
              <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-gray-900 backdrop-blur-sm">
                Couverture
              </span>
            )}

            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label="Retirer cette photo"
              className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-red-700"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700">
          <ImagePlus className="size-5" aria-hidden />
          <span className="text-xs font-medium">Ajouter</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFilesSelected}
            className="sr-only"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        JPEG/PNG/WebP, 5 Mo maximum par photo, 10 photos au total.
      </p>
    </Card>
  )
}
