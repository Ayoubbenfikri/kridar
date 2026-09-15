/**
 * Mirrors backend App\Services\SettingService exactly — the keys are
 * the constants SettingService::LISTING_FEE and ::COMMISSION_RATE, and
 * the same object shape comes back from:
 *
 *   GET /api/v1/settings          (public, read)
 *   PUT /api/v1/admin/settings    (admin, write — returns the new state)
 *
 * Both values arrive as JSON numbers (the backend casts to float), not
 * as decimal strings like prices do.
 */
export interface PlatformSettings {
  /** What an owner pays once to publish a long-term listing, in MAD. */
  listing_publication_fee: number
  /** Kridar's cut of a short-term booking, in percent (10 = 10%). */
  short_term_commission_rate: number
}
