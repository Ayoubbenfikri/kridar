import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import * as authApi from './authApi'
import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from './authApi'
import type { LocaleCode } from '@/i18n'
import type { User } from '@/types/user'

const ME_QUERY_KEY = ['auth', 'me'] as const

/**
 * Single hook for everything auth-related. GET /auth/me (via TanStack
 * Query) is the ONE source of truth for "who is logged in" - register/
 * login just seed that same cache with the user they got back instead
 * of keeping a separate copy of the user anywhere else, so there's never
 * a way for two different "current user" values to disagree.
 */
export function useAuth() {
  const queryClient = useQueryClient()

  const meQuery = useQuery<User>({
    queryKey: ME_QUERY_KEY,
    queryFn: authApi.fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user)
    },
  })

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ME_QUERY_KEY })
    },
  })

  const resendVerificationMutation = useMutation({
    mutationFn: authApi.resendVerificationEmail,
  })

  // No cache write on success for either of these - nobody is logged in
  // yet at either step (forgot-password) or the user is about to be sent
  // to /login to do that themselves (reset-password), so there's no "who
  // is logged in" state to update.
  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => authApi.updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user)
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => authApi.updatePassword(payload),
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user)
    },
  })

  const deleteAvatarMutation = useMutation({
    mutationFn: authApi.deleteAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user)
    },
  })

  /**
   * Phase 27. Lives here rather than in useLocale so that ME_QUERY_KEY
   * stays private to this file — a second module writing to the profile
   * cache by a duplicated key is exactly how the "who is logged in"
   * single source of truth stops being single.
   *
   * The interface has already switched by the time this runs; this only
   * makes the choice outlive the browser. See useLocale.
   */
  const updateLocaleMutation = useMutation({
    mutationFn: (locale: LocaleCode) => authApi.updateLocale(locale),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_QUERY_KEY, user)
    },
  })

  /**
   * AcceptTermsModal's button. Same reseed-the-cache pattern as every
   * other mutation here - the response's needs_terms_acceptance is what
   * makes the modal unmount right after this resolves, no extra state.
   */
  const acceptTermsMutation = useMutation({
    mutationFn: authApi.acceptTerms,
    onSuccess: (user) => {
      queryClient.setQueryData(ME_QUERY_KEY, user)
    },
  })

  /**
   * The "Danger zone" section on AccountSettingsPage. Same cache-clearing
   * as logout on success - the account is gone, so "who is logged in"
   * goes back to nobody. AccountSettingsPage still navigates away itself
   * on success: clearing this cache alone was not enough to move the
   * user off the settings page in practice, since nothing re-reads it
   * until something forces a re-render.
   */
  const deleteAccountMutation = useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ME_QUERY_KEY })
    },
  })

  // A 401 on GET /auth/me just means "nobody is logged in" - that's an
  // expected, normal state, not something to show as an error.
  const isUnauthenticated = isAxiosError(meQuery.error) && meQuery.error.response?.status === 401

  return {
    user: meQuery.data ?? null,
    isLoadingUser: meQuery.isLoading,
    isAuthenticated: Boolean(meQuery.data),
    isUnauthenticated,
    register: registerMutation,
    login: loginMutation,
    logout: logoutMutation,
    resendVerification: resendVerificationMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    updateProfile: updateProfileMutation,
    updatePassword: updatePasswordMutation,
    uploadAvatar: uploadAvatarMutation,
    deleteAvatar: deleteAvatarMutation,
    updateLocale: updateLocaleMutation,
    acceptTerms: acceptTermsMutation,
    deleteAccount: deleteAccountMutation,
  }
}
