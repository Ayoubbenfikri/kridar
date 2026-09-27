/**
 * Mirrors backend App\Http\Resources\PropertyResource exactly (see
 * routes/api/properties.php). Decimal-cast fields (price, lat/lng) come
 * back from Laravel as strings, not numbers — format them with
 * Number(...) when displaying.
 */
export type PropertyType = 'apartment' | 'villa' | 'studio' | 'riad' | 'office'
export type RentalType = 'short_term' | 'long_term' | 'both'
export type PropertyStatusValue = 'draft' | 'pending_review' | 'published' | 'suspended' | 'archived'

/**
 * Mirrors backend App\Enums\PublicationStatus. Null means this listing
 * predates the Phase 29 monetization overhaul (grandfathered — it never
 * owes a fee). A non-null value is unrelated to rental_type now: every
 * owner's first-ever listing is free and stored as `paid`; every one
 * after that is `pending_payment` until settled.
 */
export type PublicationStatusValue = 'pending_payment' | 'paid'

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

  /**
   * True when this is an ADDITIONAL listing (Phase 29 — every owner's
   * first-ever listing is free, whatever its rental_type) whose one-off
   * publication fee is still owed. Also false whenever
   * settings.payments_enabled is false. Computed by the backend
   * (Property::requiresPublicationFee()) rather than re-derived here, so
   * the rule lives in exactly one place.
   */
  requires_publication_fee: boolean
  publication_status: PublicationStatusValue | null
  publication_paid_at: string | null

  /**
   * True when this listing publishes its owner's number at all: the
   * owner opted in and has a number on file. Phase 29 — no longer
   * limited to long-term listings, every published listing can list a
   * number. Sent to EVERYONE, anonymous included — it says a number
   * exists, not what it is, so the page can honestly say "log in to see
   * it".
   */
  owner_phone_available: boolean
  /**
   * Phase 29 (monetization overhaul) — has THE CURRENT VIEWER paid to
   * reveal THIS listing's number? Independent of messaging credits.
   * Always true while settings.payments_enabled is false. Use this
   * (not owner_phone being non-null) to decide between showing a "reveal
   * for X MAD" button and the unlocked number.
   */
  owner_phone_unlocked: boolean
  /**
   * The number itself. Null unless owner_phone_available AND the viewer
   * is logged in with a verified email AND owner_phone_unlocked. Only
   * ever populated on the details endpoint — the listing index never
   * carries it.
   */
  owner_phone: string | null

  // Only populated when the backend query added withAvg/withCount
  // (published listing + property details) - null/0 otherwise.
  average_rating: number | null
  reviews_count: number

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
