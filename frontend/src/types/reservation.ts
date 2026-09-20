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

  /** What the guest pays. */
  total_price: string

  /**
   * How total_price splits, snapshotted when the reservation was
   * created. Decimal-cast on the backend, so these arrive as strings
   * like "150.00"; wrap in Number() for arithmetic.
   *
   * All three are "0.00" on a long-term reservation: Kridar takes
   * nothing from rent, so owner_amount equals total_price.
   */
  commission_rate: string
  commission_amount: string
  owner_amount: string

  /**
   * Whether this booking has a settled payment. Comes from the server
   * (a subquery on the list endpoints), not from local state — paying
   * sends the browser to the payment provider and back, so any React
   * state saying "just paid" is gone by the time the user returns.
   */
  is_paid: boolean

  guests_count: number | null
  status: ReservationStatusValue
  cancellation_reason: string | null
  cancelled_at: string | null
  created_at: string
}

/**
 * POST /reservations/price-preview.
 *
 * Unlike the fields on Reservation above, these come back as plain JSON
 * NUMBERS: the endpoint returns PricingService's array directly, not a
 * decimal-cast Eloquent model.
 */
export interface PricePreview {
  unit_price: number
  /** Nights for a short-term booking, whole months for a long-term one. */
  units: number
  total_price: number
  /** Percent. 0 for a long-term booking. */
  commission_rate: number
  commission_amount: number
  owner_amount: number
}

export interface PricePreviewPayload {
  property_id: number
  rental_type: ReservationRentalType
  start_date: string
  end_date: string
}

/**
 * Mirrors App\Services\AvailabilityService::getUnavailableRanges(). Used
 * by AvailabilityCalendar to grey out already-booked/blocked days.
 */
export interface AvailabilityResponse {
  reservations: Array<{ start_date: string; end_date: string }>
  blocked: Array<{ start_date: string; end_date: string; reason: string | null }>
}
