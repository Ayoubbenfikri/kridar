import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { propertiesApi } from './propertiesApi'
import type { PropertyFormPayload } from './propertiesApi'

/**
 * List of published properties, one page at a time. keepPreviousData
 * means the grid doesn't flash empty while a new page loads — the old
 * page stays visible (slightly dimmed by isFetching in the UI) until
 * the new one is ready.
 */
export function useProperties(page: number) {
  return useQuery({
    queryKey: ['properties', { page }],
    queryFn: () => propertiesApi.fetchProperties({ page }),
    placeholderData: keepPreviousData,
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
