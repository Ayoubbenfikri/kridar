import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { propertiesApi } from './propertiesApi'

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
