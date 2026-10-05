/**
 * Mirrors backend App\Http\Resources\PropertyResource exactly (see
 * routes/api/properties.php). Decimal-cast fields (price, lat/lng) come
 * back from Laravel as strings, not numbers — format them with
 * Number(...) when displaying.
 */
// 'land' (terrain) can only be SOLD — the backend refuses it on a rental.
export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'studio'
  | 'riad'
  | 'office'
  | 'land'
  | 'commercial'

/** 'rent' = a rental (the original kind of listing), 'sale' = a property for sale. */
export type ListingType = 'rent' | 'sale'
export type RentalType = 'short_term' | 'long_term' | 'both'

/** Sale listings only. Mirrors backend App\Enums\PropertyCondition. */
export type PropertyCondition = 'new' | 'good' | 'to_renovate'

/**
 * Sale listings only. Mirrors backend App\Enums\LegalStatus. Whatever the
 * seller declares — Kridar does not verify the title.
 */
export type LegalStatus = 'titled' | 'registering' | 'melkia' | 'other'

/** Backend PropertySearchRequest `sort`. Missing means 'newest'. */
export type PropertySort = 'newest' | 'price_asc' | 'price_desc'
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
  avatar_url: string | null
}

export interface Property {
  id: number
  title: string
  slug: string
  description: string
  property_type: PropertyType
  listing_type: ListingType
  /** Null on a property for sale — it has no rental mode. */
  rental_type: RentalType | null

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

  /** Both null on a property for sale. */
  price_per_night: string | null
  price_per_month: string | null

  /** Sale listings only (null on a rental) — what the seller declared. */
  sale_price: string | null
  price_negotiable: boolean
  year_built: number | null
  property_condition: PropertyCondition | null
  legal_status: LegalStatus | null

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

  /**
   * Null when the owner's account was soft-deleted (PropertyResource) —
   * owner_id's restrictOnDelete() only guards a real SQL DELETE, not a
   * soft delete. Realistically only hit on the admin moderation list
   * (the one screen showing every property, any owner).
   */
  owner: PropertyOwner | null
  amenities: Amenity[]
  images: PropertyImage[]

  created_at: string
  updated_at: string
}

/**
 * Laravel's default pagination envelope (from ->response() in
 * PropertyController::index).
 */
/**
 * GET /properties/price-histogram - the data behind the price slider.
 * Mirrors backend PriceHistogramBuilder: `min`/`max` are the slider's
 * bounds (max is a "nice" number just above the top price, and the last bar
 * also counts everything above it), `step` a natural increment, `buckets`
 * the ~30 bars. total === 0 means nothing is published for this kind of
 * search (min and max are then both 0 and buckets is empty).
 */
export interface PriceHistogramBucket {
  from: number
  to: number
  count: number
}

export interface PriceHistogram {
  min: number
  max: number
  step: number
  total: number
  buckets: PriceHistogramBucket[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
