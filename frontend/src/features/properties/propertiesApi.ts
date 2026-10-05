import axiosClient from '@/api/axiosClient'
import type {
  LegalStatus,
  ListingType,
  PaginatedResponse,
  PriceHistogram,
  Property,
  PropertyCondition,
  PropertyImage,
  PropertySort,
  PropertyType,
  RentalType,
} from '@/types/property'

/**
 * Mirrors backend PropertySearchRequest exactly - every key below is a
 * rule in that request class. Nothing else is accepted server-side, so
 * nothing else belongs here.
 */
export interface FetchPropertiesParams {
  page?: number
  per_page?: number
  /** Missing means 'rent' — the backend never mixes sales into a rental search. */
  listing_type?: ListingType
  /** Missing means newest first. Price sorts follow the price filter's column. */
  sort?: PropertySort
  q?: string
  city?: string
  property_type?: PropertyType
  rental_type?: RentalType
  min_price?: number
  max_price?: number
  bedrooms?: number
  bathrooms?: number
  max_guests?: number
  amenities?: number[]
}

async function fetchProperties(params: FetchPropertiesParams = {}): Promise<PaginatedResponse<Property>> {
  const { data } = await axiosClient.get<PaginatedResponse<Property>>('/api/v1/properties', {
    params,
  })
  return data
}

/**
 * Mirrors backend PriceHistogramRequest: only the two things that decide
 * WHICH price column is meant (sale_price / price_per_month /
 * price_per_night). Same rule as the search itself.
 */
export interface FetchPriceHistogramParams {
  listing_type?: ListingType
  rental_type?: RentalType
}

async function fetchPriceHistogram(params: FetchPriceHistogramParams = {}): Promise<PriceHistogram> {
  const { data } = await axiosClient.get<{ data: PriceHistogram }>('/api/v1/properties/price-histogram', {
    params,
  })
  return data.data
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
 *
 * Two kinds of listing share this payload (property sales):
 *  - a rental sends rental_type + bedrooms/bathrooms + the nightly/monthly
 *    prices;
 *  - a sale sends sale_price (+ the optional sale fields) and NO
 *    rental_type or rental prices.
 * The backend keeps only the fields that belong to the listing's kind, so
 * anything extra is silently dropped there — PropertyForm's buildPayload()
 * simply doesn't send what doesn't apply. `listing_type` is read on create
 * only; it can never change afterwards (UpdatePropertyRequest ignores it).
 */
export interface PropertyFormPayload {
  listing_type: ListingType
  title: string
  description: string
  property_type: PropertyType
  rental_type?: RentalType
  address: string
  city: string
  region?: string
  latitude?: number
  longitude?: number
  /** Required for a rental. Optional for a sale (a plot of land has none). */
  bedrooms?: number
  bathrooms?: number
  max_guests?: number
  area_sqm?: number
  price_per_night?: number
  price_per_month?: number
  sale_price?: number
  price_negotiable?: boolean
  /** null (not undefined) = "clear it": these three are nullable on update. */
  year_built?: number | null
  property_condition?: PropertyCondition | null
  legal_status?: LegalStatus | null
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

/** Same shape as ownerApi's PaymentStart - kept local rather than shared
 * across features, since both are trivial and this avoids a feature-to-
 * feature import for one line of typing. */
export interface PhoneRevealStart {
  redirectUrl: string | null
}

/**
 * POST /properties/{id}/phone-reveal — Phase 29 (monetization overhaul).
 * Pay once to see this listing's owner phone number. Independent of
 * messaging credits, and leaves the app the same way payPublicationFee
 * does: this only STARTS the payment, the gateway's return URL is what
 * settles it.
 */
async function revealPhone(propertyId: number): Promise<PhoneRevealStart> {
  const { data } = await axiosClient.post<{ message: string; redirect_url: string | null }>(
    `/api/v1/properties/${propertyId}/phone-reveal`,
  )
  return { redirectUrl: data.redirect_url }
}

export const propertiesApi = {
  fetchProperties,
  fetchPriceHistogram,
  fetchProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  deletePropertyImage,
  revealPhone,
}
