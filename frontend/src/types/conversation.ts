/**
 * Mirrors backend App\Http\Resources\ConversationResource and
 * MessageResource.
 *
 * Both are VIEWER-DEPENDENT, unlike every other resource in the app:
 * `counterpart`, `viewer_is_owner`, `unread_count` and `is_mine` are
 * computed from whoever is asking. Do not cache these under a key that
 * ignores the current user.
 */
export interface ConversationCounterpart {
  id: number
  name: string
}

/** Only these columns are loaded (EloquentConversationRepository). */
export interface ConversationPropertySummary {
  id: number | null
  title: string | null
  slug: string | null
  city: string | null
}

/**
 * Phase R2 (roommate listings) — the equivalent of
 * ConversationPropertySummary for a thread about a roommate post
 * instead of a property. Only one of `property`/`roommate_listing` is
 * ever non-null on a given Conversation — see `listing_type`.
 */
export interface ConversationRoommateListingSummary {
  id: number | null
  title: string | null
  type: 'offer' | 'request' | null
  city: string | null
}

export interface Conversation {
  id: number
  /**
   * Which of `property` / `roommate_listing` actually applies to this
   * thread — read this first rather than checking which block is
   * non-null, so a reader never has to guess.
   */
  listing_type: 'property' | 'roommate_listing'
  property: ConversationPropertySummary
  /** Populated only when listing_type is 'roommate_listing'. */
  roommate_listing: ConversationRoommateListingSummary
  /** The other person. Null only if the listing relation failed to load. */
  counterpart: ConversationCounterpart | null
  /** True when the viewer owns the listing this thread is about. */
  viewer_is_owner: boolean
  /** Populated on the inbox; 0 on a single conversation. */
  unread_count: number
  last_message_at: string | null
  created_at: string
}

/**
 * "Partager une annonce" — a safe summary of a shared listing, hand-built
 * on the backend (MessageResource), never the full Property/RoommateListing
 * payload. At most one of Message's two `shared_*` fields is ever non-null.
 */
export interface MessageSharedProperty {
  id: number
  title: string
  slug: string
  city: string
  price_per_night: string | null
  price_per_month: string | null
  currency: string
  cover_image_url: string | null
}

export interface MessageSharedRoommateListing {
  id: number
  title: string
  type: 'offer' | 'request'
  city: string
  price_per_person: string | null
  budget_min: string | null
  budget_max: string | null
  currency: string
  cover_image_url: string | null
}

export interface Message {
  id: number
  body: string
  sender: { id: number; name: string | null }
  /** Which side of the thread to render this on. */
  is_mine: boolean
  read_at: string | null
  created_at: string
  shared_property: MessageSharedProperty | null
  shared_roommate_listing: MessageSharedRoommateListing | null
}

/**
 * GET /conversations/{id}. Messages arrive NEWEST FIRST so page 1 is the
 * bottom of the thread — reverse before rendering.
 */
export interface ConversationThread {
  conversation: Conversation
  messages: Message[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
