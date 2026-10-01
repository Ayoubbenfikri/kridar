import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { roommateListingsApi } from './roommateListingsApi'
import type { FetchRoommateListingsParams, RoommateListingFormPayload } from './roommateListingsApi'

/**
 * List of published roommate posts, one page at a time. Same
 * keepPreviousData convention as useProperties — the grid does not flash
 * empty while a new page loads.
 */
export function useRoommateListings(
  params: FetchRoommateListingsParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['roommateListings', params],
    queryFn: () => roommateListingsApi.fetchRoommateListings(params),
    placeholderData: keepPreviousData,
    // Map view (RoommateListingsPage): lets the page skip the separate
    // up-to-50-results map query while list view is showing — same
    // `enabled` pass-through as useProperties. undefined (every existing
    // caller) behaves as enabled, so this is backward compatible.
    enabled: options?.enabled,
  })
}

export function useRoommateListing(id: string | undefined) {
  return useQuery({
    queryKey: ['roommateListings', id],
    queryFn: () => roommateListingsApi.fetchRoommateListing(id as string),
    enabled: id !== undefined,
  })
}

/**
 * The current user's own posts — "my posts" screen. Kept under the same
 * 'roommateListings' query-key prefix as the two reads above, rather than
 * a separate 'owner' prefix the way useOwner.ts does for properties:
 * there is no owner-dashboard shell for roommate listings, so one shared
 * prefix is enough for every mutation below to invalidate everything with
 * a single call.
 */
export function useOwnRoommateListings(page: number) {
  return useQuery({
    queryKey: ['roommateListings', 'mine', { page }],
    queryFn: () => roommateListingsApi.fetchOwnRoommateListings(page),
    placeholderData: keepPreviousData,
  })
}

export function useCreateRoommateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RoommateListingFormPayload) => roommateListingsApi.createRoommateListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommateListings'] })
    },
  })
}

export function useUpdateRoommateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RoommateListingFormPayload }) =>
      roommateListingsApi.updateRoommateListing(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommateListings'] })
    },
  })
}

export function useDeleteRoommateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => roommateListingsApi.deleteRoommateListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommateListings'] })
    },
  })
}

export function usePublishRoommateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => roommateListingsApi.publishRoommateListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommateListings'] })
    },
  })
}

export function useUnpublishRoommateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => roommateListingsApi.unpublishRoommateListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommateListings'] })
    },
  })
}

export function useUploadRoommateListingImages(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (files: File[]) => roommateListingsApi.uploadRoommateListingImages(id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommateListings'] })
    },
  })
}

export function useDeleteRoommateListingImage(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageId: number) => roommateListingsApi.deleteRoommateListingImage(id, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommateListings'] })
    },
  })
}
