import type { LocaleCode } from '@/i18n'

export type UserRole = 'user' | 'admin'
export type UserStatus = 'active' | 'suspended'

/**
 * Mirrors backend app/Http/Resources/UserResource.php exactly - do not
 * add fields here that the backend doesn't actually send.
 */
export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  /**
   * Consent to show `phone` on this user's long-term listings. Off by
   * default — the number was given to create an account, not to be
   * published. Set from /account/settings.
   */
  show_phone_on_listings: boolean
  /**
   * Interface language saved on the account (Phase 27). The type comes
   * from @/i18n rather than being spelled out again here, so the list of
   * languages lives in exactly one place on the frontend — and mirrors
   * App\Enums\Locale on the backend.
   *
   * Read once when the profile arrives (useAccountLocaleSync), so signing
   * in on a new device restores the language the person chose rather than
   * whatever that browser happened to have.
   */
  locale: LocaleCode
  role: UserRole
  status: UserStatus
  email_verified: boolean
  created_at: string
}
