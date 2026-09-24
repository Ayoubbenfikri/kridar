import axiosClient from '@/api/axiosClient'
import type { LocaleCode } from '@/i18n'
import type { User } from '@/types/user'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
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
