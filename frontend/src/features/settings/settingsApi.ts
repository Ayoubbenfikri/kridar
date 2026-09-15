import axiosClient from '@/api/axiosClient'
import type { PlatformSettings } from '@/types/settings'

/**
 * Kridar's two configurable prices. Reading is PUBLIC (an owner must
 * see the publication fee before creating a listing, a guest must see
 * the commission before booking), writing is admin-only — hence two
 * different URLs for what is otherwise the same object.
 */
async function fetchSettings(): Promise<PlatformSettings> {
  const { data } = await axiosClient.get<{ settings: PlatformSettings }>('/api/v1/settings')
  return data.settings
}

/**
 * PUT /admin/settings — UpdateSettingsRequest requires BOTH fields, so
 * the whole object is always sent, never a partial patch.
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
