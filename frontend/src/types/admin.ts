import type { Payment } from './payment'

/**
 * Mirrors AdminService::getStats() exactly (backend
 * app/Services/AdminService.php) - every key below is returned by
 * GET /admin/stats, and nothing else is.
 */
export interface AdminStats {
  users_count: number
  active_users_count: number
  suspended_users_count: number
  owners_count: number
  properties_count: number
  published_properties_count: number
  reservations_count: number
  completed_reservations_count: number
  reviews_count: number
  average_rating: number | null

  /**
   * Phase 22 (pricing) — Kridar's two revenue streams.
   *
   * Careful: total_revenue changed meaning. It used to be the sum of
   * every paid payment, which counted the owners' money as if it were
   * Kridar's. It is now long_term_revenue + short_term_revenue — what
   * the platform actually keeps.
   */
  long_term_revenue: number
  short_term_revenue: number
  total_revenue: number

  /** Money that passed THROUGH the platform on paid bookings. Not income. */
  bookings_volume: number

  paid_publications_count: number
  /** Long-term listings that owe the fee and have not settled it. */
  unpaid_publications_count: number

  /** The rates currently in force. */
  listing_fee: number
  commission_rate: number
}

/**
 * A payment row as GET /admin/payments returns it: the base Payment
 * plus the relations AdminService::listPayments() eager loads.
 *
 * `property` is null on a reservation payment and `reservation` is null
 * on a publication payment — exactly one of the two is ever filled.
 */
export interface AdminPayment extends Payment {
  user?: { id: number; name: string; email: string }
  property?: { id: number; title: string } | null
  reservation?: {
    id: number
    total_price: string
    commission_rate: string
    commission_amount: string
    owner_amount: string
  } | null
}
