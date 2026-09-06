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
  total_revenue: number
  reviews_count: number
  average_rating: number | null
}
