/**
 * Mirrors backend App\Services\SettingService exactly — the keys are
 * its constants LISTING_FEE, COMMISSION_RATE and PAYPAL_RATE, and the
 * same object shape comes back from:
 *
 *   GET /api/v1/settings          (public, read)
 *   PUT /api/v1/admin/settings    (admin, write — returns the new state)
 *
 * All values arrive as JSON numbers (the backend casts to float), not
 * as decimal strings like prices do.
 */
export interface PlatformSettings {
  /** What an owner pays once to publish a long-term listing, in MAD. */
  listing_publication_fee: number
  /** Kridar's cut of a short-term booking, in percent (10 = 10%). */
  short_term_commission_rate: number
  /**
   * How many MAD one unit of the PayPal currency is worth (10.8 = one
   * EUR costs 10.80 MAD). PayPal does not accept MAD, so every amount
   * is divided by this right before the call. UpdateSettingsRequest
   * refuses 0 — the backend divides by it.
   */
  mad_to_paypal_rate: number
}
