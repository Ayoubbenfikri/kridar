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
  total_revenue: number
  reviews_count: number
  average_rating: number | null
}
