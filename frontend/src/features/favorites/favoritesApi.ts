import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse, Property } from '@/types/property'

export interface FetchFavoritesParams {
  page?: number
  per_page?: number
}

async function fetchFavorites(params: FetchFavoritesParams = {}): Promise<PaginatedResponse<Property>> {
  const { data } = await axiosClient.get<PaginatedResponse<Property>>('/api/v1/favorites', {
    params,
  })
  return data
}

async function addFavorite(propertyId: number): Promise<void> {
  await axiosClient.post(`/api/v1/favorites/${propertyId}`)
}

async function removeFavorite(propertyId: number): Promise<void> {
  await axiosClient.delete(`/api/v1/favorites/${propertyId}`)
}

export const favoritesApi = {
  fetchFavorites,
  addFavorite,
  removeFavorite,
}
