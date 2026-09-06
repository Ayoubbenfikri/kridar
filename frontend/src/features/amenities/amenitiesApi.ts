import axiosClient from '@/api/axiosClient'
import type { Amenity } from '@/types/property'

async function fetchAmenities(): Promise<Amenity[]> {
  const { data } = await axiosClient.get<{ amenities: Amenity[] }>('/api/v1/amenities')
  return data.amenities
}

export const amenitiesApi = { fetchAmenities }
