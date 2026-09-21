import { Link } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useMessagesUnreadCount } from '@/features/messaging/useMessaging'

/**
 * Messages icon + unread dot for the navbar, deliberately built to match
 * NotificationBell exactly — same shape, same `showLabel` prop for the
 * mobile panel, same dot. Two indicators sitting side by side should not
 * look like they came from different apps.
 *
 * Only rendered for a logged-in user (see Navbar), which is also why
 * the unread query can be enabled unconditionally here.
 */
export default function MessagesLink({ showLabel = false }: { showLabel?: boolean }) {
  const unreadCount = useMessagesUnreadCount(true)
  const hasUnread = unreadCount > 0

  return (
    <Link
      to="/messages"
      aria-label={hasUnread ? `Messages (${unreadCount} non lus)` : 'Messages'}
      className={
        showLabel
          ? 'flex items-center gap-3 text-[15px] font-medium text-gray-600 transition hover:text-gray-900'
          : 'relative flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900'
      }
    >
      <span className="relative flex">
        <MessageSquare className={showLabel ? 'size-4.5 text-gray-400' : 'size-5'} aria-hidden />
        {hasUnread && (
          <span
            className={
              showLabel
                ? 'absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent'
                : 'absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent ring-2 ring-white'
            }
          />
        )}
      </span>
      {showLabel && (
        <span>
          Messages
          {hasUnread && <span className="ml-1 text-xs font-semibold text-accent">({unreadCount})</span>}
        </span>
      )}
    </Link>
  )
}
