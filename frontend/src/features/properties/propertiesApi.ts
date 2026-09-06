import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse, Property, PropertyImage, PropertyType, RentalType } from '@/types/property'

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

/**
 * Shared shape for both POST /properties (StorePropertyRequest - every
 * field effectively required, enforced server-side) and PUT
 * /properties/{id} (UpdatePropertyRequest - every field optional) - we
 * always send the whole form, the backend validates what actually
 * matters for each endpoint. Optional numeric fields are `undefined`
 * (not sent) rather than empty string, since the backend rules are
 * `numeric`/`integer`, not "accepts empty string".
 */
export interface PropertyFormPayload {
  title: string
  description: string
  property_type: PropertyType
  rental_type: RentalType
  address: string
  city: string
  region?: string
  latitude?: number
  longitude?: number
  bedrooms: number
  bathrooms: number
  max_guests?: number
  area_sqm?: number
  price_per_night?: number
  price_per_month?: number
  amenity_ids: number[]
}

async function createProperty(payload: PropertyFormPayload): Promise<Property> {
  const { data } = await axiosClient.post<{ message: string; property: Property }>(
    '/api/v1/properties',
    payload,
  )
  return data.property
}

async function updateProperty(propertyId: number, payload: PropertyFormPayload): Promise<Property> {
  const { data } = await axiosClient.put<{ property: Property }>(
    `/api/v1/properties/${propertyId}`,
    payload,
  )
  return data.property
}

async function deleteProperty(propertyId: number): Promise<void> {
  await axiosClient.delete(`/api/v1/properties/${propertyId}`)
}

/**
 * POST /properties/{id}/images - multipart, up to 10 images total
 * (enforced server-side against what the property already has), 5MB/
 * jpeg|png|webp each (see StorePropertyImageRequest). The very first
 * image a property ever gets becomes its cover automatically - there
 * is no "set as cover" endpoint, so the frontend never offers one.
 */
async function uploadPropertyImages(propertyId: number, files: File[]): Promise<PropertyImage[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('images[]', file))

  const { data } = await axiosClient.post<{ message: string; images: PropertyImage[] }>(
    `/api/v1/properties/${propertyId}/images`,
    formData,
  )
  return data.images
}

async function deletePropertyImage(propertyId: number, imageId: number): Promise<void> {
  await axiosClient.delete(`/api/v1/properties/${propertyId}/images/${imageId}`)
}

export const propertiesApi = {
  fetchProperties,
  fetchProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  deletePropertyImage,
}
