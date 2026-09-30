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
 * Opens the thread about this listing, or continues the existing one,
 * and posts the message — one call, because an empty thread is not
 * something anyone wants in their inbox.
 *
 * The backend refuses an unpublished listing or your own (409).
 */
async function startConversation(propertyId: number, body: string): Promise<Conversation> {
  const { data } = await axiosClient.post<{ message: string; conversation: Conversation }>(
    '/api/v1/conversations',
    { property_id: propertyId, body },
  )
  return data.conversation
}

/**
 * Same as startConversation() above, but for a roommate post — the
 * backend's StoreConversationRequest accepts EITHER property_id or
 * roommate_listing_id, never both, so this is a separate call rather
 * than an optional parameter on the one above.
 */
async function startRoommateConversation(roommateListingId: number, body: string): Promise<Conversation> {
  const { data } = await axiosClient.post<{ message: string; conversation: Conversation }>(
    '/api/v1/conversations',
    { roommate_listing_id: roommateListingId, body },
  )
  return data.conversation
}

async function sendMessage(conversationId: number, body: string): Promise<Message> {
  const { data } = await axiosClient.post<{ message: string; data: Message }>(
    `/api/v1/conversations/${conversationId}/messages`,
    { body },
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
  startRoommateConversation,
  sendMessage,
  markRead,
  buyMessagingPack,
}
