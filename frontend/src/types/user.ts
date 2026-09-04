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
  role: UserRole
  status: UserStatus
  email_verified: boolean
  created_at: string
}
