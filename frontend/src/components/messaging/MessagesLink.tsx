import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageSquare } from 'lucide-react'
import { useMessagesUnreadCount } from '@/features/messaging/useMessaging'

/**
 * Messages icon + unread dot, deliberately built to match NotificationBell
 * exactly — same shape, same `showLabel` prop, same dot. Two indicators
 * sitting side by side should not look like they came from different apps.
 *
 * Only rendered for a logged-in user (see Navbar), which is also why
 * the unread query can be enabled unconditionally here.
 *
 * `showLabel` (nav redesign) is the sidebar's row style now — same
 * padding/rounding/hover as every other sidebar link (Navbar's
 * sidebarLinkClass) — since the sidebar is the only place this renders
 * with a label; the icon-only variant is unused for now but kept in case
 * a future compact/collapsed state needs it.
 *
 * RTL (Phase 27): the dot sits on the icon's TRAILING corner — -end-0.5
 * rather than -right-0.5 — so it stays on the outside edge in Darija
 * instead of landing over the label.
 */
export default function MessagesLink({ showLabel = false }: { showLabel?: boolean }) {
  const { t } = useTranslation()
  const unreadCount = useMessagesUnreadCount(true)
  const hasUnread = unreadCount > 0

  return (
    <Link
      to="/messages"
      aria-label={hasUnread ? t('nav.messagesUnread', { n: unreadCount }) : t('nav.messages')}
      className={
        showLabel
          ? 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900'
          : 'relative flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900'
      }
    >
      <span className="relative flex">
        <MessageSquare className={showLabel ? 'size-4.5 text-gray-400' : 'size-5'} aria-hidden />
        {hasUnread && (
          <span
            className={
              showLabel
                ? 'absolute -top-0.5 -end-0.5 size-2 rounded-full bg-accent'
                : 'absolute -top-0.5 -end-0.5 size-2 rounded-full bg-accent ring-2 ring-white'
            }
          />
        )}
      </span>
      {showLabel && (
        <span>
          {t('nav.messages')}
          {hasUnread && <span className="ms-1 text-xs font-semibold text-accent">({unreadCount})</span>}
        </span>
      )}
    </Link>
  )
}
