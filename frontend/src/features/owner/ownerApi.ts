import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse, Property } from '@/types/property'
import type { Reservation } from '@/types/reservation'
import type { OwnerStats } from '@/types/owner'

async function fetchOwnerProperties(page: number): Promise<PaginatedResponse<Property>> {
  const { data } = await axiosClient.get<PaginatedResponse<Property>>('/api/v1/owner/properties', {
    params: { page },
  })
  return data
}

async function fetchOwnerReservations(page: number): Promise<PaginatedResponse<Reservation>> {
  const { data } = await axiosClient.get<PaginatedResponse<Reservation>>('/api/v1/owner/reservations', {
    params: { page },
  })
  return data
}

async function fetchOwnerStats(): Promise<OwnerStats> {
  const { data } = await axiosClient.get<{ stats: OwnerStats }>('/api/v1/owner/stats')
  return data.stats
}

/**
 * publish/unpublish/confirm/reject/cancel below hit the SAME endpoints
 * already used elsewhere (properties.ts routes, reservations.ts routes)
 * — there is no separate "owner" version of these actions on the
 * backend, ownership is enforced by the Policy on each one.
 */
async function publishProperty(propertyId: number): Promise<Property> {
  const { data } = await axiosClient.patch<{ message: string; property: Property }>(
    `/api/v1/properties/${propertyId}/publish`,
  )
  return data.property
}

async function unpublishProperty(propertyId: number): Promise<Property> {
  const { data } = await axiosClient.patch<{ message: string; property: Property }>(
    `/api/v1/properties/${propertyId}/unpublish`,
  )
  return data.property
}

async function confirmReservation(reservationId: number): Promise<Reservation> {
  const { data } = await axiosClient.patch<{ message: string; reservation: Reservation }>(
    `/api/v1/reservations/${reservationId}/confirm`,
  )
  return data.reservation
}

async function rejectReservation(reservationId: number): Promise<Reservation> {
  const { data } = await axiosClient.patch<{ message: string; reservation: Reservation }>(
    `/api/v1/reservations/${reservationId}/reject`,
  )
  return data.reservation
}

async function cancelReservationAsOwner(reservationId: number, reason?: string): Promise<Reservation> {
  const { data } = await axiosClient.patch<{ message: string; reservation: Reservation }>(
    `/api/v1/reservations/${reservationId}/cancel`,
    { reason },
  )
  return data.reservation
}

export const ownerApi = {
  fetchOwnerProperties,
  fetchOwnerReservations,
  fetchOwnerStats,
  publishProperty,
  unpublishProperty,
  confirmReservation,
  rejectReservation,
  cancelReservationAsOwner,
}
