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

export interface Message {
  id: number
  body: string
  sender: { id: number; name: string | null }
  /** Which side of the thread to render this on. */
  is_mine: boolean
  read_at: string | null
  created_at: string
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
