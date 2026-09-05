import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from './notificationsApi'

/**
 * The full Notifications page, one page at a time - same pagination
 * pattern as useProperties/useFavorites.
 */
export function useNotifications(page: number) {
  return useQuery({
    queryKey: ['notifications', 'list', { page }],
    queryFn: () => notificationsApi.fetchNotifications(page),
    placeholderData: keepPreviousData,
  })
}

/**
 * Unread count for the bell badge. Counts unread notifications among
 * only the most recent page (same simple, good-enough-for-now approach
 * as useFavoriteIds) - shares its cache entry with useNotifications(1),
 * so visiting the Notifications page doesn't trigger a second fetch.
 */
export function useUnreadCount(enabled: boolean): number {
  const query = useQuery({
    queryKey: ['notifications', 'list', { page: 1 }],
    queryFn: () => notificationsApi.fetchNotifications(1),
    enabled,
    staleTime: 30 * 1000,
  })

  return query.data?.data.filter((notification) => notification.read_at === null).length ?? 0
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
