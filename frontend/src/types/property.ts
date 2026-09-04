/**
 * Mirrors backend App\Http\Resources\PropertyResource exactly (see
 * routes/api/properties.php). Decimal-cast fields (price, lat/lng) come
 * back from Laravel as strings, not numbers — format them with
 * Number(...) when displaying.
 */
export type PropertyType = 'apartment' | 'villa' | 'studio' | 'riad' | 'office'
export type RentalType = 'short_term' | 'long_term' | 'both'
export type PropertyStatusValue = 'draft' | 'pending_review' | 'published' | 'suspended' | 'archived'

export interface PropertyImage {
  id: number
  url: string
  is_cover: boolean
  sort_order: number
}

export interface Amenity {
  id: number
  name: string
  icon: string | null
  category: string | null
}

/**
 * The owner nested inside a property is loaded with only `id,name` on
 * the backend (see EloquentPropertyRepository::paginatePublished /
 * PropertyController::show) — other User fields are never reliably
 * populated here, so this type only claims what's actually sent.
 */
export interface PropertyOwner {
  id: number
  name: string
}

export interface Property {
  id: number
  title: string
  slug: string
  description: string
  property_type: PropertyType
  rental_type: RentalType

  address: string
  city: string
  region: string | null
  country: string
  latitude: string | null
  longitude: string | null

  bedrooms: number
  bathrooms: number
  max_guests: number | null
  area_sqm: string | null

  price_per_night: string | null
  price_per_month: string | null
  currency: string

  status: PropertyStatusValue
  is_featured: boolean
  published_at: string | null

  owner: PropertyOwner
  amenities: Amenity[]
  images: PropertyImage[]

  created_at: string
  updated_at: string
}

/**
 * Laravel's default pagination envelope (from ->response() in
 * PropertyController::index).
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
