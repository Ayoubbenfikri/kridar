import axiosClient from '@/api/axiosClient'
import type { AdminStats } from '@/types/admin'
import type { PaginatedResponse, Property } from '@/types/property'
import type { User } from '@/types/user'

/**
 * The /admin/* endpoints (routes/api/admin.php), all behind
 * auth:sanctum + the 'admin' middleware.
 *
 * Only `page` is sent: AdminService::listUsers/listProperties take a
 * perPage argument but the controller never passes one, so the page
 * size is fixed at 15 server-side and there is no filter or search
 * parameter to send.
 */
async function fetchUsers(page: number): Promise<PaginatedResponse<User>> {
  const { data } = await axiosClient.get<PaginatedResponse<User>>('/api/v1/admin/users', {
    params: { page },
  })
  return data
}

async function fetchProperties(page: number): Promise<PaginatedResponse<Property>> {
  const { data } = await axiosClient.get<PaginatedResponse<Property>>('/api/v1/admin/properties', {
    params: { page },
  })
  return data
}

async function fetchStats(): Promise<AdminStats> {
  const { data } = await axiosClient.get<{ stats: AdminStats }>('/api/v1/admin/stats')
  return data.stats
}

/**
 * There is no matching "reactivate" route: suspending an account is
 * one-way from the API's point of view. The UI has to say so.
 */
async function suspendUser(userId: number): Promise<User> {
  const { data } = await axiosClient.patch<{ user: User }>(`/api/v1/admin/users/${userId}/suspend`)
  return data.user
}

/** Publishes a property whatever its current status - this is the only
    way back to Published for a suspended listing. */
async function approveProperty(propertyId: number): Promise<Property> {
  const { data } = await axiosClient.patch<{ property: Property }>(
    `/api/v1/admin/properties/${propertyId}/approve`,
  )
  return data.property
}

async function suspendProperty(propertyId: number): Promise<Property> {
  const { data } = await axiosClient.patch<{ property: Property }>(
    `/api/v1/admin/properties/${propertyId}/suspend`,
  )
  return data.property
}

export const adminApi = {
  fetchUsers,
  fetchProperties,
  fetchStats,
  suspendUser,
  approveProperty,
  suspendProperty,
}
