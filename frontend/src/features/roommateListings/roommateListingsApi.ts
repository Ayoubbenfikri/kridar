import axiosClient from '@/api/axiosClient'
import type {
  PaginatedResponse,
  RoommateListing,
  RoommateListingImage,
  RoommateListingType,
} from '@/types/roommateListing'

/**
 * Mirrors backend RoommateListingSearchRequest exactly — every key below
 * is a rule in that request class. Same convention as
 * features/properties/propertiesApi.ts's FetchPropertiesParams.
 */
export interface FetchRoommateListingsParams {
  page?: number
  per_page?: number
  q?: string
  city?: string
  type?: RoommateListingType
  min_price?: number
  max_price?: number
  beds?: number
  bedrooms?: number
  furnished?: boolean
  available_by?: string
}

async function fetchRoommateListings(
  params: FetchRoommateListingsParams = {},
): Promise<PaginatedResponse<RoommateListing>> {
  const { data } = await axiosClient.get<PaginatedResponse<RoommateListing>>('/api/v1/roommate-listings', {
    params,
  })
  return data
}

async function fetchRoommateListing(id: number | string): Promise<RoommateListing> {
  const { data } = await axiosClient.get<{ roommate_listing: RoommateListing }>(
    `/api/v1/roommate-listings/${id}`,
  )
  return data.roommate_listing
}

/**
 * GET /roommate-listings/mine — the current user's own posts, any status
 * (draft included). Deliberately NOT under /owner/* like propertiesApi's
 * equivalent: that group requires already owning a property (see the
 * backend 'owner' middleware), and posting a roommate listing has nothing
 * to do with that — see RoommateListingController::mine().
 */
async function fetchOwnRoommateListings(page = 1): Promise<PaginatedResponse<RoommateListing>> {
  const { data } = await axiosClient.get<PaginatedResponse<RoommateListing>>(
    '/api/v1/roommate-listings/mine',
    { params: { page } },
  )
  return data
}

/**
 * Shared shape for POST /roommate-listings (StoreRoommateListingRequest -
 * price_per_person/beds/bedrooms/furnished required when type is "offer",
 * people_count required when type is "request") and PUT
 * /roommate-listings/{id} (UpdateRoommateListingRequest - every field
 * optional). Same "always send the whole form, the backend validates what
 * matters" convention as properties' PropertyFormPayload.
 */
export interface RoommateListingFormPayload {
  type: RoommateListingType
  title: string
  description: string
  city: string
  neighborhood?: string
  address?: string
  price_per_person?: number
  beds?: number
  bedrooms?: number
  furnished?: boolean
  people_count?: number
  available_from?: string
}

async function createRoommateListing(payload: RoommateListingFormPayload): Promise<RoommateListing> {
  const { data } = await axiosClient.post<{ message: string; roommate_listing: RoommateListing }>(
    '/api/v1/roommate-listings',
    payload,
  )
  return data.roommate_listing
}

async function updateRoommateListing(
  id: number,
  payload: RoommateListingFormPayload,
): Promise<RoommateListing> {
  const { data } = await axiosClient.put<{ roommate_listing: RoommateListing }>(
    `/api/v1/roommate-listings/${id}`,
    payload,
  )
  return data.roommate_listing
}

async function deleteRoommateListing(id: number): Promise<void> {
  await axiosClient.delete(`/api/v1/roommate-listings/${id}`)
}

async function publishRoommateListing(id: number): Promise<RoommateListing> {
  const { data } = await axiosClient.patch<{ message: string; roommate_listing: RoommateListing }>(
    `/api/v1/roommate-listings/${id}/publish`,
  )
  return data.roommate_listing
}

async function unpublishRoommateListing(id: number): Promise<RoommateListing> {
  const { data } = await axiosClient.patch<{ message: string; roommate_listing: RoommateListing }>(
    `/api/v1/roommate-listings/${id}/unpublish`,
  )
  return data.roommate_listing
}

/**
 * POST /roommate-listings/{id}/images - multipart, up to 10 images total
 * (checked against what the post already has), 5MB/jpeg|png|webp each
 * (see StoreRoommateListingImageRequest). Same "no set-as-cover endpoint"
 * convention as properties - the first image ever uploaded becomes the
 * cover automatically (RoommateListingImageService).
 */
async function uploadRoommateListingImages(id: number, files: File[]): Promise<RoommateListingImage[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('images[]', file))

  const { data } = await axiosClient.post<{ message: string; images: RoommateListingImage[] }>(
    `/api/v1/roommate-listings/${id}/images`,
    formData,
  )
  return data.images
}

async function deleteRoommateListingImage(id: number, imageId: number): Promise<void> {
  await axiosClient.delete(`/api/v1/roommate-listings/${id}/images/${imageId}`)
}

export const roommateListingsApi = {
  fetchRoommateListings,
  fetchRoommateListing,
  fetchOwnRoommateListings,
  createRoommateListing,
  updateRoommateListing,
  deleteRoommateListing,
  publishRoommateListing,
  unpublishRoommateListing,
  uploadRoommateListingImages,
  deleteRoommateListingImage,
}
