import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { messagingApi } from './messagingApi'
import type { MessagingPackDuration, SharedListingAttachment } from './messagingApi'

/**
 * Messaging reads are namespaced under 'conversations', so one
 * invalidateQueries({ queryKey: ['conversations'] }) after sending
 * refreshes the inbox, the open thread and the unread badge together —
 * same convention as useOwner and useAdmin.
 *
 * New messages arrive by POLLING, not websockets. That was a deliberate
 * choice: zero new infrastructure, works on any host, and the
 * notification bell already works this way. If Reverb is added later,
 * only these intervals disappear — the API and the components do not
 * change.
 */

/** Gentle: the inbox is a list you scan, not a live feed. */
const INBOX_POLL_MS = 30_000

/** Faster: an open thread is a conversation someone is in right now. */
const THREAD_POLL_MS = 10_000

export function useConversations(page: number) {
  return useQuery({
    queryKey: ['conversations', 'list', { page }],
    queryFn: () => messagingApi.fetchConversations(page),
    placeholderData: keepPreviousData,
    refetchInterval: INBOX_POLL_MS,
  })
}

/**
 * The navbar badge. `enabled` exists because the navbar renders for
 * logged-out visitors too — polling a 401 every 30 seconds would be
 * noise in the console and in the logs.
 */
export function useMessagesUnreadCount(enabled: boolean) {
  const query = useQuery({
    queryKey: ['conversations', 'unread-count'],
    queryFn: () => messagingApi.fetchUnreadCount(),
    enabled,
    refetchInterval: INBOX_POLL_MS,
  })

  return query.data ?? 0
}

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', 'thread', conversationId],
    queryFn: () => messagingApi.fetchConversation(conversationId as string),
    enabled: conversationId !== undefined,
    refetchInterval: THREAD_POLL_MS,
  })
}

export function useStartConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      propertyId,
      body,
      shared,
    }: {
      propertyId: number
      body: string
      shared?: SharedListingAttachment
    }) => messagingApi.startConversation(propertyId, body, shared),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Owner-initiated version of useStartConversation() above — the
 * "Contacter" button on OwnerReservationsPage. Never charged against
 * the owner's free-contact credits (see
 * MessagingService::startOrContinueAsOwner on the backend), so unlike
 * ContactOwnerCard there is no 402/MessagingPaywall case to handle here.
 */
export function useStartConversationWithGuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      propertyId,
      guestId,
      body,
      shared,
    }: {
      propertyId: number
      guestId: number
      body: string
      shared?: SharedListingAttachment
    }) => messagingApi.startConversationWithGuest(propertyId, guestId, body, shared),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/** Same as useStartConversation() above, but for a roommate post. */
export function useStartRoommateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      roommateListingId,
      body,
      shared,
    }: {
      roommateListingId: number
      body: string
      shared?: SharedListingAttachment
    }) => messagingApi.startRoommateConversation(roommateListingId, body, shared),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ body, shared }: { body: string; shared?: SharedListingAttachment }) =>
      messagingApi.sendMessage(conversationId, body, shared),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Edit your own message. Invalidates the whole 'conversations' key —
 * same convention as useSendMessage() — so the thread view's cache
 * picks up the new body/edited_at on the next read.
 */
export function useEditMessage(conversationId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: number; body: string }) =>
      messagingApi.editMessage(conversationId, messageId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/** Soft delete your own message. Same invalidation as useEditMessage() above. */
export function useDeleteMessage(conversationId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: number) => messagingApi.deleteMessage(conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: number) => messagingApi.markRead(conversationId),
    onSuccess: () => {
      // The badge and the inbox both change; the thread itself does not
      // need to refetch just because it was marked read.
      queryClient.invalidateQueries({ queryKey: ['conversations', 'unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['conversations', 'list'] })
    },
  })
}

/**
 * Phase 29 (monetization overhaul) — buy a 7 or 15 day unlimited
 * messaging pass. Does not touch the 'conversations' cache (nothing
 * about messaging changed yet, only a payment was started) — the auth
 * profile (free_contacts_remaining / messaging_pack_expires_at) only
 * actually changes once the payer returns from the gateway and GET
 * /auth/me is refetched.
 */
export function useBuyMessagingPack() {
  return useMutation({
    mutationFn: (duration: MessagingPackDuration) => messagingApi.buyMessagingPack(duration),
  })
}
