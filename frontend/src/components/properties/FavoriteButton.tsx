import { Heart } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/useFavorites'
import { cn } from '@/lib/cn'

/**
 * Heart toggle, reused on PropertyCard and PropertyDetailsPage.
 * Renders nothing for a logged-out visitor - favorites require
 * auth:sanctum on the backend, so there is nothing to toggle yet.
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
      aria-pressed={isFavorited}
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition',
        'hover:scale-105 hover:bg-white disabled:opacity-50',
        isFavorited ? 'text-red-500' : 'text-gray-500 hover:text-red-500',
      )}
    >
      <Heart className={cn('size-4.5', isFavorited && 'fill-current')} aria-hidden />
    </button>
  )
}
