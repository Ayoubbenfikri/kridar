import { useAuth } from '@/features/auth/useAuth'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/useFavorites'

/**
 * Heart toggle button, reused on PropertyCard and PropertyDetailsPage.
 * Renders nothing for a logged-out visitor - favorites require
 * auth:sanctum on the backend, so there's nothing to toggle yet.
 */
export default function FavoriteButton({ propertyId }: { propertyId: number }) {
  const { isAuthenticated } = useAuth()
  const { ids } = useFavoriteIds(isAuthenticated)
  const toggleFavorite = useToggleFavorite()

  if (!isAuthenticated) {
    return null
  }

  const isFavorited = ids.has(propertyId)

  return (
    <button
      type="button"
      onClick={() => toggleFavorite.mutate({ propertyId, isFavorited })}
      disabled={toggleFavorite.isPending}
      aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition hover:bg-white disabled:opacity-50"
    >
      <span className={isFavorited ? 'text-red-500' : 'text-gray-400'}>{isFavorited ? '♥' : '♡'}</span>
    </button>
  )
}
