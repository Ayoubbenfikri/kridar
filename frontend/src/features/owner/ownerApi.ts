import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse, Property } from '@/types/property'
import type { Payment } from '@/types/payment'
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

/**
 * Phase 22 (pricing) — the owner pays the one-off fee that lets a
 * long-term listing go live. The AMOUNT is never sent: the backend
 * reads it from SettingService, so it cannot be chosen from here.
 *
 * Same two-step shape as payReservation() in features/reservations:
 * there is no real CMI merchant account yet (backend
 * App\Services\Gateways\FakeCmiGateway), so "paying" means starting a
 * Payment record then immediately simulating the gateway telling us it
 * succeeded. When CmiGateway replaces the fake one, this becomes a
 * single `window.location.href = redirect_url` and the second call
 * disappears — the backend does not change at all.
 *
 * redirect_url comes back null when the admin has set the fee to 0: the
 * backend already settled it, so there is nothing to confirm.
 */
async function payPublicationFee(propertyId: number): Promise<Property> {
  const { data: initiated } = await axiosClient.post<{
    message: string
    payment: Payment
    redirect_url: string | null
  }>(`/api/v1/properties/${propertyId}/publication-payment`)

  if (initiated.redirect_url !== null) {
    await axiosClient.post(`/api/v1/payments/${initiated.payment.id}/callback`, { success: true })
  }

  // The callback is what publishes the listing server-side, so read the
  // property back instead of guessing what it became.
  const { data } = await axiosClient.get<{ property: Property }>(`/api/v1/properties/${propertyId}`)
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
  payPublicationFee,
  confirmReservation,
  rejectReservation,
  cancelReservationAsOwner,
}
