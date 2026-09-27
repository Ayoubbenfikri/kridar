import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from './settingsApi'
import type { PlatformSettings } from '@/types/settings'

const SETTINGS_QUERY_KEY = ['settings'] as const

/**
 * staleTime is long on purpose: these numbers change maybe twice a year,
 * and they are read on the property form, the booking panel and the admin
 * dashboard. Refetching them on every mount would be pure noise.
 */
const STALE_TIME = 5 * 60 * 1000

/**
 * The platform settings — every configurable number plus payments_enabled.
 *
 * GET /settings returns an envelope (Phase 28), and `select` unwraps it so
 * every existing caller keeps reading `settings.listing_publication_fee`
 * exactly as before. useSupport() below selects the other half of the SAME
 * query, so the two views cost one request between them, not two.
 */
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => settingsApi.fetchSettings(),
    staleTime: STALE_TIME,
    select: (response) => response.settings,
  })
}

/**
 * The configured donation methods, for /support (Phase 28).
 *
 * Only methods that are actually set come back — the backend strips the
 * empty ones — so the page renders what exists instead of checking six
 * fields for blank strings.
 */
export function useSupport() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => settingsApi.fetchSettings(),
    staleTime: STALE_TIME,
    select: (response) => response.support,
  })
}

/**
 * Is Kridar charging for anything right now?
 *
 * Its own hook because almost every caller wants just this one boolean,
 * and because the default matters: while the request is in flight this
 * answers FALSE. Defaulting to "free" is the safe direction — a pay button
 * that flashes into view for a moment and then vanishes looks broken, and
 * worse, invites a click on something that would be refused.
 */
export function usePaymentsEnabled(): boolean {
  const { data } = useSettings()

  return data?.payments_enabled ?? false
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PlatformSettings) => settingsApi.updateSettings(payload),
    onSuccess: () => {
      // Invalidate rather than setQueryData (Phase 28). The PUT response
      // is only the three writable numbers, so writing it straight into
      // the cache would replace the whole envelope and lose
      // payments_enabled and the support methods with it — the pay buttons
      // would then reappear until the next reload. One extra GET after a
      // rare admin action is a cheap price for not having that bug.
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
      // The admin dashboard shows the current fee/rate next to the
      // revenue figures, so it has to refresh too.
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
