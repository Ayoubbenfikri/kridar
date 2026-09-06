import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse } from '@/types/property'
import type { AvailabilityResponse, Reservation, ReservationRentalType } from '@/types/reservation'
import type { Payment } from '@/types/payment'

export interface CreateReservationPayload {
  property_id: number
  rental_type: ReservationRentalType
  start_date: string
  end_date: string
  guests_count?: number
}

async function fetchAvailability(
  propertyId: number | string,
  start: string,
  end: string,
): Promise<AvailabilityResponse> {
  const { data } = await axiosClient.get<AvailabilityResponse>(
    `/api/v1/properties/${propertyId}/availability`,
    { params: { start, end } },
  )
  return data
}

async function createReservation(payload: CreateReservationPayload): Promise<Reservation> {
  const { data } = await axiosClient.post<{ message: string; reservation: Reservation }>(
    '/api/v1/reservations',
    payload,
  )
  return data.reservation
}

async function fetchMyReservations(page: number): Promise<PaginatedResponse<Reservation>> {
  const { data } = await axiosClient.get<PaginatedResponse<Reservation>>('/api/v1/reservations', {
    params: { page },
  })
  return data
}

async function cancelReservation(reservationId: number, reason?: string): Promise<Reservation> {
  const { data } = await axiosClient.patch<{ message: string; reservation: Reservation }>(
    `/api/v1/reservations/${reservationId}/cancel`,
    { reason },
  )
  return data.reservation
}

/**
 * There is no real CMI merchant account yet (see backend
 * App\Services\Gateways\FakeCmiGateway) - "paying" here means starting a
 * Payment record then immediately simulating the gateway telling us it
 * succeeded, exactly like test-payments.ps1/test-owner.ps1 already do
 * against this same fake gateway. This is a clear placeholder for the
 * real hosted checkout redirect, not a shortcut around a real one.
 */
async function payReservation(reservationId: number): Promise<Payment> {
  const { data: initiated } = await axiosClient.post<{ payment: Payment; redirect_url: string }>(
    `/api/v1/reservations/${reservationId}/payments`,
  )
  const { data: callbackResult } = await axiosClient.post<{ message: string; payment: Payment }>(
    `/api/v1/payments/${initiated.payment.id}/callback`,
    { success: true },
  )
  return callbackResult.payment
}

export const reservationsApi = {
  fetchAvailability,
  createReservation,
  fetchMyReservations,
  cancelReservation,
  payReservation,
}
