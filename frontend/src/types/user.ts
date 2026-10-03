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
  /** Profile photo, or null until one is uploaded (/account/settings). */
  avatar_url: string | null
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

  /**
   * Terms of Use / Privacy Policy. True means the blocking
   * AcceptTermsModal must show - either this account never accepted at
   * all (registered before this feature existed) or the wording changed
   * since it last accepted. A brand-new registration always accepts the
   * current version as part of signing up, so this is false immediately
   * after RegisterForm succeeds.
   */
  needs_terms_acceptance: boolean

  /**
   * Messaging paywall (Phase 29). Starts at 5, spent one at a time by
   * starting a genuinely NEW conversation — replying is always free, so
   * this only ever goes down on the FIRST message to a given owner.
   * Meaningless while settings.payments_enabled is false: check that
   * first, this stays whatever it was before payments went off.
   */
  free_contacts_remaining: number
  /**
   * When the current unlimited-messaging pass runs out, or null if there
   * isn't one. A pass in force means free_contacts_remaining is not even
   * consulted (see MessagingCreditsService::checkAccess on the backend).
   */
  messaging_pack_expires_at: string | null

  created_at: string
}
