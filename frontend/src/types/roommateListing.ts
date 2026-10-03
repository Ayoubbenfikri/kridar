/**
 * Mirrors backend App\Http\Resources\RoommateListingResource exactly
 * (see routes/api/roommate-listings.php). Same conventions as
 * types/property.ts: decimal-cast fields (price_per_person) come back
 * as strings, not numbers.
 */
export type RoommateListingType = 'offer' | 'request'
export type RoommateListingStatusValue = 'draft' | 'published' | 'suspended' | 'archived'

export interface RoommateListingImage {
  id: number
  url: string
  is_cover: boolean
  sort_order: number
}

/**
 * Loaded with only `id,name` on the backend (see
 * EloquentRoommateListingRepository::paginatePublished /
 * RoommateListingController::show) — same "only claim what's actually
 * sent" convention as types/property.ts's PropertyOwner.
 */
export interface RoommateListingUser {
  id: number
  name: string
  avatar_url: string | null
}

export interface RoommateListing {
  id: number
  type: RoommateListingType
  title: string
  description: string

  city: string
  neighborhood: string | null
  address: string | null
  latitude: string | null
  longitude: string | null

  price_per_person: string | null
  budget_min: string | null
  budget_max: string | null
  currency: string
  beds: number | null
  bedrooms: number | null
  furnished: boolean | null
  people_count: number | null
  available_from: string | null

  status: RoommateListingStatusValue
  published_at: string | null

  /**
   * Null when the poster's account was soft-deleted (RoommateListingResource)
   * — user_id's restrictOnDelete() only guards a real SQL DELETE, not a
   * soft delete. Only the admin moderation list realistically hits this
   * (it is the one screen showing every post, any author); other pages
   * only ever render published posts from active accounts, but it is
   * still typed here honestly rather than lied about.
   */
  user: RoommateListingUser | null
  images: RoommateListingImage[]

  created_at: string
  updated_at: string
}

// Laravel's default pagination envelope is not property-specific —
// reused from types/property.ts rather than redefined here.
export type { PaginatedResponse } from './property'
