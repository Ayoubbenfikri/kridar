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

  /**
   * Phase 26 — listings waiting on a human decision. The one number that
   * answers "do I have work to do today", and the one that was missing.
   */
  pending_review_properties_count: number

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

/**
 * Phase 26 — the audit trail. Mirrors App\Enums\AdminAction; these
 * strings are stored in the database, so they are stable.
 */
export type AdminActionValue =
  | 'user.suspended'
  | 'user.activated'
  | 'property.approved'
  | 'property.suspended'
  | 'settings.updated'

/**
 * One recorded admin action, as GET /admin/activity returns it
 * (AdminActivityLogResource).
 */
export interface AdminActivityLog {
  id: number
  action: AdminActionValue

  /**
   * Null when the acting admin's account was since deleted — User uses
   * soft deletes, so the relation comes back empty while admin_id stays
   * on the row. The UI says so rather than showing a blank author.
   */
  admin: { id: number; name: string; email: string } | null

  /**
   * 'User' | 'Property', or null for an action with no single target
   * (a settings change). Deliberately not a foreign key on the backend:
   * a log row has to survive its target being deleted, which is why
   * target_label exists as a snapshot of the name at the time.
   */
  target_type: string | null
  target_id: number | null
  target_label: string | null

  /** Action-specific details. Shape depends on `action`. */
  context: Record<string, unknown> | null

  ip_address: string | null
  created_at: string
}
