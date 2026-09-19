/**
 * Mirrors backend App\Services\OwnerDashboardService::getStats() exactly
 * (see OwnerController::stats / GET /owner/stats).
 */
export interface OwnerStats {
  properties_count: number
  published_properties_count: number
  reservations_count: number
  pending_reservations_count: number
  completed_reservations_count: number

  /**
   * Phase 22 (pricing): what the owner RECEIVES, Kridar's commission
   * already deducted. It used to be the full amount the guest paid,
   * which overstated the owner's earnings.
   */
  total_revenue: number
  /** What Kridar kept on those same bookings. 0 in long-term only. */
  total_commission: number

  reviews_count: number
  average_rating: number | null
}
