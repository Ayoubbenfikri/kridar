/**
 * Mirrors backend App\Services\SettingService and config/support.php.
 *
 * GET /api/v1/settings returns an ENVELOPE (Phase 28):
 *
 *   { settings: {...three numbers, payments_enabled}, support: {...} }
 *
 * PUT /api/v1/admin/settings accepts and returns only the three numbers —
 * see PlatformSettings. The two shapes are deliberately separate types:
 * payments_enabled and the support methods come from config, not from the
 * settings table, and an admin cannot write them from the dashboard.
 */

/**
 * The three numbers an admin can actually change. This is the PUT payload
 * as well as the PUT response, so it must not gain fields the backend's
 * UpdateSettingsRequest does not accept — it requires every one of them,
 * and an unexpected key would be ignored at best.
 */
export interface PlatformSettings {
  /**
   * What an owner pays for an ADDITIONAL listing, in MAD (Phase 29 —
   * their first-ever listing is always free, whatever its rental_type).
   */
  listing_publication_fee: number
  /**
   * Kridar's cut of a short-term booking, in percent (10 = 10%). Dormant
   * since Phase 29 — kept configurable, see PricingService on the
   * backend.
   */
  short_term_commission_rate: number
  /**
   * How many MAD one unit of the PayPal currency is worth (10.8 = one
   * EUR costs 10.80 MAD). PayPal does not accept MAD, so every amount
   * is divided by this right before the call. UpdateSettingsRequest
   * refuses 0 — the backend divides by it.
   */
  mad_to_paypal_rate: number
  /** Phase 29 — what a user pays once to reveal one owner's phone number. */
  phone_reveal_fee: number
  /** Phase 29 — a 7-day unlimited messaging pass. */
  messaging_pack_7d_fee: number
  /** Phase 29 — a 15-day unlimited messaging pass. */
  messaging_pack_15d_fee: number
}

/**
 * What GET /settings reports: the three numbers plus whether they are in
 * force at all.
 */
export interface PublicSettings extends PlatformSettings {
  /**
   * Is Kridar charging for anything? False is the launch position
   * (config/payments.php).
   *
   * The two numbers above are still reported while this is false — they
   * are what WILL apply when payments come back on, which is what the
   * admin pricing page needs to show. So never read a fee or a rate
   * without checking this first, or the interface will advertise a price
   * nobody is being charged.
   */
  payments_enabled: boolean
}

/**
 * The donation methods that are configured, for /support.
 *
 * Every field is optional and the backend STRIPS the empty ones, so a key
 * being present means it has a real value — no blank-string checks
 * needed, and the page can render exactly what exists.
 */
export interface SupportMethods {
  /**
   * A PayPal.Me HANDLE, not a URL (config/support.php). The page builds
   * the links itself, because PayPal.Me carries the amount in the path:
   * paypal.me/<handle>/25EUR.
   */
  paypal_me?: string
  /**
   * Which currency the PayPal preset amounts ask for. Always present — it
   * has a default — so unlike the other fields, its presence does NOT mean
   * a payment method is configured.
   *
   * Never MAD: PayPal does not support the dirham.
   */
  currency?: string
  /** Any other provider — Ko-fi, Buy Me a Coffee, Patreon. */
  donate_url?: string
  bank_label?: string
  bank_details?: string
  crypto_label?: string
  crypto_address?: string
  contact_email?: string
}

/** The whole GET /settings body. */
export interface SettingsResponse {
  settings: PublicSettings
  support: SupportMethods
}
