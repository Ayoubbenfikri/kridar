import axiosClient from '@/api/axiosClient'
import type { LocaleCode } from '@/i18n'
import type { User } from '@/types/user'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  /**
   * The registration-form checkbox. Backend RegisterRequest requires this
   * to be exactly `true` (Laravel's 'accepted' rule) - see RegisterForm.
   * WHICH terms version gets stamped is decided server-side, never here.
   */
  terms_accepted: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

/**
 * Laravel Sanctum SPA auth needs the XSRF-TOKEN cookie set BEFORE any
 * state-changing request (register, login...). Safe to call more than
 * once - Laravel just resets the cookie each time.
 */
async function ensureCsrfCookie(): Promise<void> {
  await axiosClient.get('/sanctum/csrf-cookie')
}

export async function register(payload: RegisterPayload): Promise<{ message: string; user: User }> {
  await ensureCsrfCookie()
  const { data } = await axiosClient.post('/api/v1/auth/register', payload)
  return data
}

export async function login(payload: LoginPayload): Promise<{ user: User }> {
  await ensureCsrfCookie()
  const { data } = await axiosClient.post('/api/v1/auth/login', payload)
  return data
}

export async function logout(): Promise<void> {
  await axiosClient.post('/api/v1/auth/logout')
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

/**
 * "I can't log in" entry point - no session yet, so it needs the CSRF
 * cookie first same as register/login. The backend returns the same
 * message whether or not the email belongs to a real account
 * (AuthController::forgotPassword) - that's on purpose, not something
 * this function hides.
 */
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  await ensureCsrfCookie()
  const { data } = await axiosClient.post('/api/v1/auth/forgot-password', payload)
  return data
}

/**
 * What ResetPasswordForm calls once the user picks a new password -
 * token/email come from the link they clicked (see
 * AppServiceProvider::createUrlUsing on the backend for how that URL is
 * built), not from anything this function looks up itself.
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
  await ensureCsrfCookie()
  const { data } = await axiosClient.post('/api/v1/auth/reset-password', payload)
  return data
}

export async function fetchMe(): Promise<User> {
  const { data } = await axiosClient.get<{ user: User }>('/api/v1/auth/me')
  return data.user
}

export async function resendVerificationEmail(): Promise<{ message: string }> {
  const { data } = await axiosClient.post('/api/v1/auth/email/verification-notification')
  return data
}

export interface UpdateProfilePayload {
  name: string
  /**
   * `null` CLEARS the number. Not the same as leaving the key out:
   * an absent key is simply not updated, so a user could never remove
   * a number once set — which matters now that it can be shown to
   * clients.
   */
  phone?: string | null
  show_phone_on_listings?: boolean
}

export interface UpdatePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<{ message: string; user: User }> {
  const { data } = await axiosClient.put('/api/v1/auth/profile', payload)
  return data
}

export async function updatePassword(payload: UpdatePasswordPayload): Promise<{ message: string }> {
  const { data } = await axiosClient.put('/api/v1/auth/password', payload)
  return data
}

/**
 * Phase 27 — persist the interface language on the account.
 *
 * Its own endpoint rather than a field on updateProfile, because that one
 * requires `name` and the switcher only knows the new language. See
 * backend UpdateLocaleRequest.
 *
 * Returns the whole user so the caller can reseed the cached profile in
 * one round trip instead of refetching /auth/me afterwards.
 */
export async function updateLocale(locale: LocaleCode): Promise<User> {
  const { data } = await axiosClient.put<{ user: User }>('/api/v1/auth/locale', { locale })
  return data.user
}

/**
 * What AcceptTermsModal's button calls. No payload - the version stamped
 * is always whatever the backend's config('legal.terms_version') is right
 * now (AuthController::acceptTerms), never something the client picks.
 */
export async function acceptTerms(): Promise<User> {
  const { data } = await axiosClient.post<{ user: User }>('/api/v1/auth/accept-terms')
  return data.user
}

/**
 * The "Danger zone" button on AccountSettingsPage, after the user has
 * typed the confirmation word. No payload - the backend doesn't ask for
 * a password here (see AuthController::deleteAccount), the confirmation
 * word is checked entirely on the frontend before this is even called.
 */
export async function deleteAccount(): Promise<{ message: string }> {
  const { data } = await axiosClient.delete('/api/v1/auth/account')
  return data
}
