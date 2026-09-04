import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse, Property } from '@/types/property'

export interface FetchPropertiesParams {
  page?: number
}

async function fetchProperties(params: FetchPropertiesParams = {}): Promise<PaginatedResponse<Property>> {
  const { data } = await axiosClient.get<PaginatedResponse<Property>>('/api/v1/properties', {
    params,
  })
  return data
}

async function fetchProperty(id: number | string): Promise<Property> {
  const { data } = await axiosClient.get<{ property: Property }>(`/api/v1/properties/${id}`)
  return data.property
}

export const propertiesApi = {
  fetchProperties,
  fetchProperty,
}
