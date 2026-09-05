import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { favoritesApi } from './favoritesApi'

/**
 * The Favorites page itself, one page at a time - same pagination
 * pattern as useProperties.
 */
export function useFavorites(page: number) {
  return useQuery({
    queryKey: ['favorites', 'list', { page }],
    queryFn: () => favoritesApi.fetchFavorites({ page }),
    placeholderData: keepPreviousData,
  })
}

/**
 * Just the set of favorited property ids, for the heart icon shown
 * elsewhere in the app (properties grid, property details page).
 * Fetches the 50 most recently favorited (the max ?per_page the
 * backend allows) in one request - simple and good enough for now; a
 * property favorited earlier than the last 50 just won't show as
 * favorited outside the Favorites page itself. Only runs when logged
 * in (no /favorites access otherwise, see routes/api/favorites.php).
 */
export function useFavoriteIds(enabled: boolean) {
  const query = useQuery({
    queryKey: ['favorites', 'ids'],
    queryFn: () => favoritesApi.fetchFavorites({ page: 1, per_page: 50 }),
    enabled,
    staleTime: 60 * 1000,
  })

  const ids = new Set(query.data?.data.map((property) => property.id) ?? [])
  return { ids, isLoading: query.isLoading }
}

/**
 * Toggles a single property's favorite state. `isFavorited` tells it
 * whether to POST (add) or DELETE (remove) - the caller already knows
 * this from useFavoriteIds(). Both add and remove are idempotent on
 * the backend, so there's no need to guard against double-clicks here.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ propertyId, isFavorited }: { propertyId: number; isFavorited: boolean }) =>
      isFavorited ? favoritesApi.removeFavorite(propertyId) : favoritesApi.addFavorite(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
