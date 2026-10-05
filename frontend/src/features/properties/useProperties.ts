import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { propertiesApi } from './propertiesApi'
import type {
  FetchPriceHistogramParams,
  FetchPropertiesParams,
  PropertyFormPayload,
} from './propertiesApi'

/**
 * List of published properties, one page at a time. keepPreviousData
 * means the grid doesn't flash empty while a new page loads — the old
 * page stays visible (slightly dimmed by isFetching in the UI) until
 * the new one is ready.
 */
export function useProperties(params: FetchPropertiesParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    // The params object IS the cache key, so two different searches are
    // two different cache entries and never overwrite each other.
    queryKey: ['properties', params],
    queryFn: () => propertiesApi.fetchProperties(params),
    placeholderData: keepPreviousData,
    // Sub-phase #3 (map view): PropertiesPage uses this to skip fetching
    // the up-to-50-results map query entirely while the grid view is
    // showing - undefined (every existing caller) behaves as enabled,
    // same as omitting the option, so this is backward compatible.
    enabled: options?.enabled,
  })
}

/**
 * Bars + bounds for the price slider. Kept for a few minutes: the
 * distribution of prices barely moves, and the slider is opened (and its
 * mode changed) far more often than listings are published. The
 * 'properties' prefix means publishing/editing a listing still refreshes
 * it, like every other properties query.
 */
export function usePriceHistogram(params: FetchPriceHistogramParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['properties', 'price-histogram', params],
    queryFn: () => propertiesApi.fetchPriceHistogram(params),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled,
  })
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => propertiesApi.fetchProperty(id as string),
    enabled: id !== undefined,
  })
}

/**
 * Create/update/delete/images below are the Phase 20bis additions (the
 * owner-facing property form). Every one invalidates both 'properties'
 * (the public listing/details - a title or cover-image edit should
 * show up there too) and 'owner' (the owner's own list + stats) — same
 * broad-prefix-invalidation convention as useReservations/useOwner.
 */
export function useCreateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PropertyFormPayload) => propertiesApi.createProperty(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ propertyId, payload }: { propertyId: number; payload: PropertyFormPayload }) =>
      propertiesApi.updateProperty(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (propertyId: number) => propertiesApi.deleteProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useUploadPropertyImages(propertyId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (files: File[]) => propertiesApi.uploadPropertyImages(propertyId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useDeletePropertyImage(propertyId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageId: number) => propertiesApi.deletePropertyImage(propertyId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

/**
 * Phase 29 (monetization overhaul) — pay to reveal one listing's owner
 * phone number. The invalidation here is mostly harmless housekeeping:
 * a real payment sends the browser away to the gateway right after this
 * resolves, and the number only actually unlocks once the payer comes
 * back through the return URL and this query is refetched.
 */
export function useRevealPhone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (propertyId: number) => propertiesApi.revealPhone(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}
