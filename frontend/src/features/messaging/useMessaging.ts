import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { messagingApi } from './messagingApi'

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
    mutationFn: ({ propertyId, body }: { propertyId: number; body: string }) =>
      messagingApi.startConversation(propertyId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) => messagingApi.sendMessage(conversationId, body),
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
