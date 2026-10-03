import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse } from '@/types/property'
import type { Conversation, ConversationThread, Message } from '@/types/conversation'

/**
 * Messaging between an interested visitor and a property owner. Every
 * thread is scoped to a listing — there is no endpoint for writing to a
 * user directly, by design.
 */
async function fetchConversations(page: number): Promise<PaginatedResponse<Conversation>> {
  const { data } = await axiosClient.get<PaginatedResponse<Conversation>>('/api/v1/conversations', {
    params: { page },
  })
  return data
}

/**
 * Just the number, for the navbar badge. A dedicated endpoint because
 * this polls often and does not need the threads themselves.
 */
async function fetchUnreadCount(): Promise<number> {
  const { data } = await axiosClient.get<{ unread_count: number }>(
    '/api/v1/conversations/unread-count',
  )
  return data.unread_count
}

async function fetchConversation(conversationId: number | string): Promise<ConversationThread> {
  const { data } = await axiosClient.get<ConversationThread>(
    `/api/v1/conversations/${conversationId}`,
  )
  return data
}

/**
 * "Partager une annonce" — optional, at most one of the two ids, attached
 * to a message when the sender picks one of their own published listings
 * via ShareListingPicker. Spread into every send call's request body as
 * shared_property_id / shared_roommate_listing_id; the backend re-checks
 * ownership and published status regardless of what is sent here.
 */
export interface SharedListingAttachment {
  sharedPropertyId?: number
  sharedRoommateListingId?: number
}

function sharedListingParams(shared?: SharedListingAttachment) {
  return {
    shared_property_id: shared?.sharedPropertyId,
    shared_roommate_listing_id: shared?.sharedRoommateListingId,
  }
}

/**
 * Opens the thread about this listing, or continues the existing one,
 * and posts the message — one call, because an empty thread is not
 * something anyone wants in their inbox.
 *
 * The backend refuses an unpublished listing or your own (409).
 */
async function startConversation(
  propertyId: number,
  body: string,
  shared?: SharedListingAttachment,
): Promise<Conversation> {
  const { data } = await axiosClient.post<{ message: string; conversation: Conversation }>(
    '/api/v1/conversations',
    { property_id: propertyId, body, ...sharedListingParams(shared) },
  )
  return data.conversation
}

/**
 * Same as startConversation() above, but for a roommate post — the
 * backend's StoreConversationRequest accepts EITHER property_id or
 * roommate_listing_id, never both, so this is a separate call rather
 * than an optional parameter on the one above.
 */
async function startRoommateConversation(
  roommateListingId: number,
  body: string,
  shared?: SharedListingAttachment,
): Promise<Conversation> {
  const { data } = await axiosClient.post<{ message: string; conversation: Conversation }>(
    '/api/v1/conversations',
    { roommate_listing_id: roommateListingId, body, ...sharedListingParams(shared) },
  )
  return data.conversation
}

/**
 * Owner-initiated: "Contacter" on OwnerReservationsPage. Same
 * find-or-continue endpoint as startConversation(), with guest_id added
 * so the backend knows this is the owner reaching out to a guest, not
 * the other way round. The backend re-checks that this guest actually
 * has a reservation on the property — sending an arbitrary id here
 * would just get a 409 back.
 */
async function startConversationWithGuest(
  propertyId: number,
  guestId: number,
  body: string,
  shared?: SharedListingAttachment,
): Promise<Conversation> {
  const { data } = await axiosClient.post<{ message: string; conversation: Conversation }>(
    '/api/v1/conversations',
    { property_id: propertyId, guest_id: guestId, body, ...sharedListingParams(shared) },
  )
  return data.conversation
}

async function sendMessage(
  conversationId: number,
  body: string,
  shared?: SharedListingAttachment,
): Promise<Message> {
  const { data } = await axiosClient.post<{ message: string; data: Message }>(
    `/api/v1/conversations/${conversationId}/messages`,
    { body, ...sharedListingParams(shared) },
  )
  return data.data
}

/** Edit your own message. The backend re-checks ownership (MessagePolicy). */
async function editMessage(
  conversationId: number,
  messageId: number,
  body: string,
): Promise<Message> {
  const { data } = await axiosClient.patch<{ message: string; data: Message }>(
    `/api/v1/conversations/${conversationId}/messages/${messageId}`,
    { body },
  )
  return data.data
}

/**
 * Soft delete your own message — the backend keeps the row and returns
 * it with is_deleted: true, body: null, which is what the thread view
 * needs to swap the bubble's text for the "Message supprimé" placeholder
 * without a page refresh.
 */
async function deleteMessage(conversationId: number, messageId: number): Promise<Message> {
  const { data } = await axiosClient.delete<{ message: string; data: Message }>(
    `/api/v1/conversations/${conversationId}/messages/${messageId}`,
  )
  return data.data
}

/** Marks what the OTHER side sent as read. Never your own messages. */
async function markRead(conversationId: number): Promise<number> {
  const { data } = await axiosClient.patch<{ marked: number }>(
    `/api/v1/conversations/${conversationId}/read`,
  )
  return data.marked
}

export type MessagingPackDuration = '7d' | '15d'

/** Same PaymentStart shape used across owner/property payments. */
export interface MessagingPackStart {
  redirectUrl: string | null
}

/**
 * POST /messaging/packs — Phase 29 (monetization overhaul). Buy a 7 or
 * 15 day unlimited messaging pass once the 5 free contacts run out. Same
 * "starts, does not settle" rule as every other payment here: only the
 * gateway return URL actually activates it.
 */
async function buyMessagingPack(duration: MessagingPackDuration): Promise<MessagingPackStart> {
  const { data } = await axiosClient.post<{ message: string; redirect_url: string | null }>(
    '/api/v1/messaging/packs',
    { duration },
  )
  return { redirectUrl: data.redirect_url }
}

export const messagingApi = {
  fetchConversations,
  fetchUnreadCount,
  fetchConversation,
  startConversation,
  startConversationWithGuest,
  startRoommateConversation,
  sendMessage,
  editMessage,
  deleteMessage,
  markRead,
  buyMessagingPack,
}
