import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from './adminApi'
import type { AdminActionValue } from '@/types/admin'
import type { PaymentTypeValue } from '@/types/payment'

/**
 * Every /admin read is namespaced under the 'admin' query key prefix, so
 * one invalidateQueries({ queryKey: ['admin'] }) after any admin action
 * refreshes users + properties + stats + payments + activity together -
 * same convention as useOwner.
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

/** Phase 22 (pricing). `type` undefined = both revenue streams. */
export function useAdminPayments(page: number, type?: PaymentTypeValue) {
  return useQuery({
    queryKey: ['admin', 'payments', { page, type }],
    queryFn: () => adminApi.fetchPayments(page, type),
    placeholderData: keepPreviousData,
  })
}

/** Phase 26 — the audit trail. `action` undefined = every kind. */
export function useAdminActivity(page: number, action?: AdminActionValue) {
  return useQuery({
    queryKey: ['admin', 'activity', { page, action }],
    queryFn: () => adminApi.fetchActivity(page, action),
    placeholderData: keepPreviousData,
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

/**
 * Phase 26. Only the user list and the stats change here — the listings
 * stay suspended on purpose, so nothing in ['properties'] moves.
 */
export function useActivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => adminApi.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
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
