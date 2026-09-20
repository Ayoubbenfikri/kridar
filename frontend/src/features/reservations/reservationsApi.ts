import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse } from '@/types/property'
import type {
  AvailabilityResponse,
  PricePreview,
  PricePreviewPayload,
  Reservation,
  ReservationRentalType,
} from '@/types/reservation'

export interface CreateReservationPayload {
  property_id: number
  rental_type: ReservationRentalType
  start_date: string
  end_date: string
  guests_count?: number
}

/** What starting a payment gives the caller: somewhere to send the browser. */
export interface PaymentStart {
  redirectUrl: string
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

/**
 * What the booking WOULD cost, and how it splits between the owner and
 * Kridar. Nothing is created and no dates are held; it exists so the
 * guest sees the real final amount before committing.
 *
 * A POST despite being a read: it takes a body of dates. The numbers
 * are computed by the backend's PricingService — the exact same code
 * that will store them if the booking goes ahead, so the preview can
 * never disagree with the reservation.
 */
async function fetchPricePreview(payload: PricePreviewPayload): Promise<PricePreview> {
  const { data } = await axiosClient.post<{ pricing: PricePreview }>(
    '/api/v1/reservations/price-preview',
    payload,
  )
  return data.pricing
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
 * Starts the payment for a confirmed booking and returns where to send
 * the browser.
 *
 * Like payPublicationFee, this only STARTS the payment. It used to also
 * POST to /payments/{id}/callback to mark it paid immediately — fine
 * against the offline fake gateway, wrong against a real one, where
 * capturing before the buyer has approved is simply rejected. The
 * provider's return URL is the only thing that settles a payment.
 */
async function payReservation(reservationId: number): Promise<PaymentStart> {
  const { data } = await axiosClient.post<{ message: string; redirect_url: string }>(
    `/api/v1/reservations/${reservationId}/payments`,
  )
  return { redirectUrl: data.redirect_url }
}

export const reservationsApi = {
  fetchAvailability,
  fetchPricePreview,
  createReservation,
  fetchMyReservations,
  cancelReservation,
  payReservation,
}
