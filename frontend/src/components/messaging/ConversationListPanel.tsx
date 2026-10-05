import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, MessageSquare, TriangleAlert, Users } from 'lucide-react'
import { useConversations } from '@/features/messaging/useMessaging'
import { getErrorMessage } from '@/lib/apiErrors'
import { formatDate, formatDateTime } from '@/lib/formatDate'
import { Badge, Card, EmptyState, Pagination, Skeleton, UserAvatar, buttonClasses } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Conversation } from '@/types/conversation'

/**
 * Formats "when did this thread last move" the way a messaging app does:
 * a time today, a weekday this week, a date beyond that. Absolute dates
 * for everything would make a live conversation look stale.
 */
function formatActivity(value: string | null): string {
  if (value === null) return ''

  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()

  if (sameDay) {
    return formatDateTime(date, { hour: '2-digit', minute: '2-digit' })
  }

  const daysAgo = (now.getTime() - date.getTime()) / 86_400_000
  if (daysAgo < 7) {
    return formatDate(date, { weekday: 'long' })
  }

  return formatDate(date, { day: '2-digit', month: 'short' })
}

function Avatar({ conversation }: { conversation: Conversation }) {
  return (
    <div className="relative shrink-0">
      <UserAvatar
        name={conversation.counterpart?.name}
        avatarUrl={conversation.counterpart?.avatar_url}
        // Falls back to the conversation's own id when there is no
        // counterpart (listing relation failed to load) — still
        // deterministic, just not tied to a specific person in that
        // edge case.
        seed={conversation.counterpart?.id ?? conversation.id}
        size="md"
      />

      {/* Property vs roommate post — a tiny badge so it reads at a
          glance while scanning the inbox, instead of only showing up in
          the text line below. */}
      <div className="absolute -end-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-gray-100">
        {conversation.listing_type === 'roommate_listing' ? (
          <Users className="size-2.5 text-gray-500" aria-hidden />
        ) : (
          <Home className="size-2.5 text-gray-500" aria-hidden />
        )}
      </div>
    </div>
  )
}

function ConversationRow({
  conversation,
  index,
  isActive,
}: {
  conversation: Conversation
  index: number
  /** The thread currently open on the right (see MessagesPage) — gets
      its own highlight, on top of the existing unread tint. */
  isActive: boolean
}) {
  const { t } = useTranslation()
  const hasUnread = conversation.unread_count > 0

  // Phase R2 (roommate listings) — a thread is about a property OR a
  // roommate post, never both. listing_type says which one to read.
  const listingTitle =
    conversation.listing_type === 'roommate_listing'
      ? conversation.roommate_listing.title
      : conversation.property.title

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
      // Capped so a long inbox doesn't make the last row wait a full
      // second to appear — rows beyond the 9th all animate together.
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
    >
      <Link
        to={`/messages/${conversation.id}`}
        className={cn(
          'flex items-start gap-3 rounded-xl border p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md',
          isActive
            ? 'border-brand-300 bg-brand-50'
            : hasUnread
              ? 'border-brand-200 bg-brand-50/60 hover:border-brand-300'
              : 'border-gray-200 bg-white hover:border-gray-300',
        )}
      >
        <Avatar conversation={conversation} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={
                hasUnread ? 'truncate font-semibold text-gray-900' : 'truncate font-medium text-gray-900'
              }
            >
              {conversation.counterpart?.name ?? t('messages.userFallback')}
            </p>
            <span className="shrink-0 text-xs text-gray-400">
              {formatActivity(conversation.last_message_at)}
            </span>
          </div>

          <p className="mt-0.5 truncate text-sm text-gray-500">{listingTitle ?? t('messages.listingDeleted')}</p>

          <div className="mt-1.5 flex items-center justify-between gap-3">
            {/* Which hat the viewer is wearing in this thread. Without
                it, an inbox mixing "listings I asked about" and "people
                asking about my listings" is confusing. */}
            <p className="truncate text-xs text-gray-400">
              {conversation.viewer_is_owner ? t('messages.aboutYourListing') : t('messages.yourRequest')}
            </p>
            {hasUnread && (
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="shrink-0"
              >
                <Badge tone="teal">{conversation.unread_count}</Badge>
              </motion.div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/**
 * The conversation list — the left column of MessagesPage's split view
 * (see that file for the two-pane layout and the responsive rules that
 * show/hide it on mobile). Fetches and paginates on its own; the only
 * thing it takes from its parent is which thread is currently open, to
 * highlight that row.
 *
 * Used to be the whole of MessagesPage before the WhatsApp-style layout
 * (list + open thread side by side) replaced "open a thread, list is
 * gone" with "list stays, thread opens next to it".
 */
export default function ConversationListPanel({ activeConversationId }: { activeConversationId?: number }) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isError, error, isFetching } = useConversations(page)

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-gray-200 p-4">
        <h1 className="text-lg font-bold tracking-tight text-gray-900">{t('messages.title')}</h1>
        {data && (
          <p className="mt-0.5 text-xs text-gray-500">
            {t('messages.count', { n: data.meta.total })}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            {getErrorMessage(error)}
          </Card>
        ) : !data ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="size-6" />}
            title={t('messages.emptyTitle')}
            description={t('messages.emptyDescription')}
            action={
              <Link to="/properties" className={buttonClasses()}>
                {t('messages.browse')}
              </Link>
            }
          />
        ) : (
          <div className={`space-y-2 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
            <AnimatePresence initial={false}>
              {data.data.map((conversation, index) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  index={index}
                  isActive={conversation.id === activeConversationId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {data && data.meta.last_page > 1 && (
        <div className="shrink-0 border-t border-gray-200 p-2">
          <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
        </div>
      )}
    </div>
  )
}
