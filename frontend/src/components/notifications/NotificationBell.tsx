import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useUnreadCount } from '@/features/notifications/useNotifications'

/**
 * Bell + unread dot, linking to /notifications - no dropdown panel, kept
 * simple on purpose. `showLabel` adds the text label for the navbar's
 * mobile panel, where an icon alone in a vertical list would be unclear.
 */
export default function NotificationBell({ showLabel = false }: { showLabel?: boolean }) {
  const unreadCount = useUnreadCount(true)
  const hasUnread = unreadCount > 0

  return (
    <Link
      to="/notifications"
      aria-label={hasUnread ? `Notifications (${unreadCount} non lues)` : 'Notifications'}
      className={
        showLabel
          ? 'flex items-center gap-3 text-[15px] font-medium text-gray-600 transition hover:text-gray-900'
          : 'relative flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900'
      }
    >
      <span className="relative flex">
        <Bell className={showLabel ? 'size-4.5 text-gray-400' : 'size-5'} aria-hidden />
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
          Notifications
          {hasUnread && <span className="ml-1 text-xs font-semibold text-accent">({unreadCount})</span>}
        </span>
      )}
    </Link>
  )
}
