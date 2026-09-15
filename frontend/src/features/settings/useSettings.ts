import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from './settingsApi'
import type { PlatformSettings } from '@/types/settings'

/**
 * The platform settings, under their own 'settings' query key prefix.
 *
 * staleTime is long on purpose: these two numbers change maybe twice a
 * year, and they are read on the property form, the booking panel and
 * the admin dashboard. Refetching them on every mount would be pure
 * noise.
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.fetchSettings(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PlatformSettings) => settingsApi.updateSettings(payload),
    onSuccess: (settings) => {
      // The PUT response already IS the new state, so write it straight
      // into the cache instead of triggering a second round trip.
      queryClient.setQueryData(['settings'], settings)
      // The admin dashboard shows the current fee/rate next to the
      // revenue figures, so it has to refresh too.
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
