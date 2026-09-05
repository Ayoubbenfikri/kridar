import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse } from '@/types/property'
import type { AppNotification } from '@/types/notification'

async function fetchNotifications(page = 1): Promise<PaginatedResponse<AppNotification>> {
  const { data } = await axiosClient.get<PaginatedResponse<AppNotification>>('/api/v1/notifications', {
    params: { page },
  })
  return data
}

async function markAsRead(id: string): Promise<void> {
  await axiosClient.patch(`/api/v1/notifications/${id}/read`)
}

async function markAllAsRead(): Promise<void> {
  await axiosClient.patch('/api/v1/notifications/read-all')
}

export const notificationsApi = {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
}
