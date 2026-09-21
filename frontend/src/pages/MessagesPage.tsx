import { Link, useSearchParams } from 'react-router-dom'
import { MessageSquare, TriangleAlert } from 'lucide-react'
import { useConversations } from '@/features/messaging/useMessaging'
import { getErrorMessage } from '@/lib/apiErrors'
import { Badge, Card, EmptyState, Pagination, Skeleton, buttonClasses } from '@/components/ui'
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
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const daysAgo = (now.getTime() - date.getTime()) / 86_400_000
  if (daysAgo < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' })
  }

  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const hasUnread = conversation.unread_count > 0

  return (
    <Link
      to={`/messages/${conversation.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={hasUnread ? 'truncate font-semibold text-gray-900' : 'truncate font-medium text-gray-900'}>
            {conversation.counterpart?.name ?? 'Utilisateur'}
          </p>
          <p className="mt-0.5 truncate text-sm text-gray-500">
            {conversation.property.title ?? 'Annonce supprimée'}
          </p>
          {/* Which hat the viewer is wearing in this thread. Without it,
              an inbox mixing "listings I asked about" and "people asking
              about my listings" is confusing. */}
          <p className="mt-1 text-xs text-gray-400">
            {conversation.viewer_is_owner ? 'À propos de votre annonce' : 'Votre demande'}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-xs text-gray-400">{formatActivity(conversation.last_message_at)}</span>
          {hasUnread && <Badge tone="teal">{conversation.unread_count}</Badge>}
        </div>
      </div>
    </Link>
  )
}

/**
 * /messages — every thread the user is in, on either side. Polls every
 * 30s (see useConversations), so a new message appears without a reload.
 */
export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isError, error, isFetching } = useConversations(page)

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Messages</h1>
      {data && (
        <p className="mt-1 text-sm text-gray-500">
          {data.meta.total} conversation{data.meta.total > 1 ? 's' : ''}
        </p>
      )}

      <div className="mt-6">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            {getErrorMessage(error)}
          </Card>
        ) : !data ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="size-6" />}
            title="Aucune conversation"
            description="Contactez un propriétaire depuis la page d'une annonce pour démarrer une conversation."
            action={
              <Link to="/properties" className={buttonClasses()}>
                Parcourir les propriétés
              </Link>
            }
          />
        ) : (
          <>
            <div className={`space-y-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              {data.data.map((conversation) => (
                <ConversationRow key={conversation.id} conversation={conversation} />
              ))}
            </div>

            <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
          </>
        )}
      </div>
    </main>
  )
}
