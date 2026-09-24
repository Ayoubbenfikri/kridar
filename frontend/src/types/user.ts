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
  role: UserRole
  status: UserStatus
  email_verified: boolean
  created_at: string
}
