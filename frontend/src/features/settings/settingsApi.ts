import axiosClient from '@/api/axiosClient'
import type { PlatformSettings, SettingsResponse } from '@/types/settings'

/**
 * Kridar's configurable numbers and its donation methods. Reading is
 * PUBLIC (an owner must see whether publishing costs anything before
 * creating a listing, a guest must see any commission before booking, and
 * /support is for anyone), writing is admin-only — hence two different
 * URLs for what looks like one object.
 */
async function fetchSettings(): Promise<SettingsResponse> {
  const { data } = await axiosClient.get<SettingsResponse>('/api/v1/settings')
  return data
}

/**
 * PUT /admin/settings — UpdateSettingsRequest requires EVERY number in
 * PlatformSettings, so the whole object is always sent, never a partial
 * patch.
 *
 * It returns only those numbers: payments_enabled and the support methods
 * are config, not admin-writable. That is why useUpdateSettings
 * invalidates the query instead of writing this response into the cache —
 * doing the latter would drop the rest of the envelope.
 */
async function updateSettings(payload: PlatformSettings): Promise<PlatformSettings> {
  const { data } = await axiosClient.put<{ message: string; settings: PlatformSettings }>(
    '/api/v1/admin/settings',
    payload,
  )
  return data.settings
}

export const settingsApi = {
  fetchSettings,
  updateSettings,
}
