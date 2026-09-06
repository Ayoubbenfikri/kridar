import { Link } from 'react-router-dom'
import { useUnreadCount } from '@/features/notifications/useNotifications'

/**
 * Bell icon + unread badge, linking to the dedicated /notifications
 * page - no dropdown panel, kept simple on purpose. `showLabel` adds a
 * text label next to the icon for the Navbar's mobile menu, where an
 * icon alone (used inline in the desktop bar) would be unclear stacked
 * in a vertical list.
 */
export default function NotificationBell({ showLabel = false }: { showLabel?: boolean }) {
  const unreadCount = useUnreadCount(true)

  return (
    <Link
      to="/notifications"
      className="flex items-center gap-2 text-gray-600 transition hover:text-brand-700"
      aria-label="Notifications"
    >
      <span className="relative text-lg">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </span>
      {showLabel && <span>Notifications</span>}
    </Link>
  )
}
