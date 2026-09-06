import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reservationsApi } from './reservationsApi'
import type { CreateReservationPayload } from './reservationsApi'

/**
 * Fetches the booked/blocked ranges for a wide window (see
 * AvailabilityCalendar) so the calendar can grey out unavailable days
 * before the guest even picks a start date. One request per property
 * per window, cached by TanStack Query - navigating months inside that
 * window (see AvailabilityCalendar) doesn't refetch.
 */
export function useAvailability(propertyId: number | undefined, start: string, end: string) {
  return useQuery({
    queryKey: ['properties', propertyId, 'availability', { start, end }],
    queryFn: () => reservationsApi.fetchAvailability(propertyId as number, start, end),
    enabled: propertyId !== undefined,
    staleTime: 60 * 1000,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateReservationPayload) => reservationsApi.createReservation(payload),
    onSuccess: (_reservation, variables) => {
      // The dates just booked are no longer available for anyone else -
      // refresh this property's availability window and "my reservations".
      queryClient.invalidateQueries({ queryKey: ['properties', variables.property_id, 'availability'] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

export function useMyReservations(page: number) {
  return useQuery({
    queryKey: ['reservations', 'list', { page }],
    queryFn: () => reservationsApi.fetchMyReservations(page),
    placeholderData: keepPreviousData,
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reservationId, reason }: { reservationId: number; reason?: string }) =>
      reservationsApi.cancelReservation(reservationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function usePayReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reservationId: number) => reservationsApi.payReservation(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}
