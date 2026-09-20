import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse, Property } from '@/types/property'
import type { Reservation } from '@/types/reservation'
import type { OwnerStats } from '@/types/owner'

/** What starting a payment gives the caller: somewhere to send the browser. */
export interface PaymentStart {
  /**
   * null only when there was nothing to pay — the admin set the
   * publication fee to 0, so the backend settled it on the spot and the
   * listing is already live.
   */
  redirectUrl: string | null
}

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

/**
 * Starts the long-term listing publication fee payment and returns
 * where to send the browser. The AMOUNT is never sent: the backend
 * reads it from SettingService, so it cannot be chosen from here.
 *
 * This function does NOT settle the payment, and must not. An earlier
 * version POSTed to /payments/{id}/callback right after, which worked
 * against the offline fake gateway but became actively wrong with a
 * real one: it asked PayPal to capture an order the buyer had never
 * approved. PayPal refused, the payment was recorded as failed, and the
 * UI still showed a success toast because every HTTP call had returned
 * 200. Approval happens on the provider's own page, and only the return
 * URL settles anything.
 */
async function payPublicationFee(propertyId: number): Promise<PaymentStart> {
  const { data } = await axiosClient.post<{ message: string; redirect_url: string | null }>(
    `/api/v1/properties/${propertyId}/publication-payment`,
  )
  return { redirectUrl: data.redirect_url }
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
  payPublicationFee,
  confirmReservation,
  rejectReservation,
  cancelReservationAsOwner,
}
