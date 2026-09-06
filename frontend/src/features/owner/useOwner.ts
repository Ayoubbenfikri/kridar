import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ownerApi } from './ownerApi'

/**
 * Every /owner/* read is namespaced under the 'owner' query key prefix
 * so a single invalidateQueries({ queryKey: ['owner'] }) after any
 * owner action (publish, confirm...) refreshes properties + reservations
 * + stats together — same prefix-matching convention already used by
 * useFavorites/useReviews/useReservations.
 */
export function useOwnerProperties(page: number) {
  return useQuery({
    queryKey: ['owner', 'properties', { page }],
    queryFn: () => ownerApi.fetchOwnerProperties(page),
    placeholderData: keepPreviousData,
  })
}

export function useOwnerReservations(page: number) {
  return useQuery({
    queryKey: ['owner', 'reservations', { page }],
    queryFn: () => ownerApi.fetchOwnerReservations(page),
    placeholderData: keepPreviousData,
  })
}

export function useOwnerStats() {
  return useQuery({
    queryKey: ['owner', 'stats'],
    queryFn: () => ownerApi.fetchOwnerStats(),
  })
}

export function usePublishProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (propertyId: number) => ownerApi.publishProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      // A published property now shows up in the public listing too.
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useUnpublishProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (propertyId: number) => ownerApi.unpublishProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useConfirmReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reservationId: number) => ownerApi.confirmReservation(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

export function useRejectReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reservationId: number) => ownerApi.rejectReservation(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

/**
 * Separate from features/reservations' useCancelReservation — same
 * backend endpoint, but this one also invalidates the 'owner' query
 * prefix so the owner's own lists/stats refresh too. Keeping it here
 * (instead of editing the guest-side hook) avoids touching
 * already-validated Phase 18 code for a case it never needed to handle.
 */
export function useCancelReservationAsOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reservationId, reason }: { reservationId: number; reason?: string }) =>
      ownerApi.cancelReservationAsOwner(reservationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}
