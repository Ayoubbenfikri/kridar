import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from './adminApi'

/**
 * Every /admin read is namespaced under the 'admin' query key prefix, so
 * one invalidateQueries({ queryKey: ['admin'] }) after any admin action
 * refreshes users + properties + stats together - same convention as
 * useOwner.
 */
export function useAdminUsers(page: number) {
  return useQuery({
    queryKey: ['admin', 'users', { page }],
    queryFn: () => adminApi.fetchUsers(page),
    placeholderData: keepPreviousData,
  })
}

export function useAdminProperties(page: number) {
  return useQuery({
    queryKey: ['admin', 'properties', { page }],
    queryFn: () => adminApi.fetchProperties(page),
    placeholderData: keepPreviousData,
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.fetchStats(),
  })
}

export function useSuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => adminApi.suspendUser(userId),
    onSuccess: () => {
      // Suspending a user also suspends their published properties
      // server-side (AdminService::suspendUser), so the public listing
      // and the admin property list both change too.
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useApproveProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (propertyId: number) => adminApi.approveProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['owner'] })
    },
  })
}

export function useSuspendProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (propertyId: number) => adminApi.suspendProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['owner'] })
    },
  })
}
