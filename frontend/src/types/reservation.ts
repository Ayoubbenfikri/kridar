export type ReservationRentalType = 'short_term' | 'long_term'
export type ReservationStatusValue = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'

/**
 * The `property` nested inside a reservation is loaded with only a few
 * summary columns (see EloquentReservationRepository::paginateForGuest
 * and ReservationController::PROPERTY_SUMMARY_COLUMNS on the backend),
 * not the full Property shape - only these fields are ever reliably
 * populated here.
 */
export interface ReservationPropertySummary {
  id: number
  title: string
  slug: string
  city: string
  price_per_night: string | null
  price_per_month: string | null
}

/**
 * Mirrors backend App\Http\Resources\ReservationResource exactly.
 * `guest` is only present on endpoints that eager-load it (e.g.
 * ReservationController::show) - omitted by the backend elsewhere, so
 * it's optional here.
 */
export interface Reservation {
  id: number
  property: ReservationPropertySummary
  guest?: { id: number; name: string }
  rental_type: ReservationRentalType
  start_date: string
  end_date: string
  unit_price: string
  total_price: string
  guests_count: number | null
  status: ReservationStatusValue
  cancellation_reason: string | null
  cancelled_at: string | null
  created_at: string
}

/**
 * Mirrors App\Services\AvailabilityService::getUnavailableRanges(). Used
 * by AvailabilityCalendar to grey out already-booked/blocked days.
 */
export interface AvailabilityResponse {
  reservations: Array<{ start_date: string; end_date: string }>
  blocked: Array<{ start_date: string; end_date: string; reason: string | null }>
}
