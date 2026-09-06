import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import * as authApi from './authApi'
import type { LoginPayload, RegisterPayload, UpdatePasswordPayload, UpdateProfilePayload } from './authApi'
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

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => authApi.updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user)
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => authApi.updatePassword(payload),
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
    updateProfile: updateProfileMutation,
    updatePassword: updatePasswordMutation,
  }
}
