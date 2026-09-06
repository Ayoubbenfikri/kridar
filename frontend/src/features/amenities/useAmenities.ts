import { useQuery } from '@tanstack/react-query'
import { amenitiesApi } from './amenitiesApi'

/**
 * Reference data (see backend database/seeders/AmenitiesSeeder.php) -
 * it basically never changes, so a long staleTime avoids refetching it
 * every time the property form mounts.
 */
export function useAmenities() {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: () => amenitiesApi.fetchAmenities(),
    staleTime: 60 * 60 * 1000,
  })
}
