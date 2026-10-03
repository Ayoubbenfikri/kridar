import { Outlet, useParams } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import ConversationListPanel from '@/components/messaging/ConversationListPanel'
import { cn } from '@/lib/cn'

/**
 * Shown on the right when no thread is open — only reachable on desktop
 * (md+), since on mobile the list itself fills that space instead (see
 * the responsive classes below). This is the index child of the
 * 'messages' route (router.tsx), rendered through MessagesPage's
 * <Outlet /> exactly like ConversationPage is for 'messages/:id'.
 */
export function MessagesEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-gray-400">
      <MessageSquare className="size-10" aria-hidden />
      <p className="text-sm">Sélectionnez une conversation pour l'ouvrir.</p>
    </div>
  )
}

/**
 * /messages and /messages/:id — one WhatsApp-style split view instead of
 * two separate pages. The list (ConversationListPanel) is always
 * mounted; the right side is whichever child route matched
 * (MessagesEmptyState with no id, ConversationPage with one) — React
 * Router hands us that through <Outlet />, so this component doesn't
 * need to know which one it is.
 *
 * Responsive rule, same as the WhatsApp mobile app: md+ screens show
 * both columns side by side. Below md there is only room for one, so
 * the list is full-width at /messages and the thread is full-width at
 * /messages/:id (with its own back arrow — see ConversationPage) — which
 * one shows is decided purely by whether `id` is present, no extra
 * state to keep in sync.
 */
export default function MessagesPage() {
  const { id } = useParams<{ id?: string }>()
  const hasActiveThread = id !== undefined

  return (
    <main className="mx-auto w-full max-w-6xl px-0 py-0 sm:px-4 sm:py-6 lg:py-8">
      <div className="flex h-[calc(100dvh-8rem)] overflow-hidden border border-gray-200 bg-white shadow-sm sm:rounded-2xl lg:h-[calc(100dvh-6rem)]">
        <aside
          className={cn(
            'w-full shrink-0 flex-col border-gray-200 sm:border-r md:flex md:w-80 lg:w-96',
            hasActiveThread ? 'hidden md:flex' : 'flex',
          )}
        >
          <ConversationListPanel activeConversationId={id ? Number(id) : undefined} />
        </aside>

        <section
          className={cn(
            'min-h-0 min-w-0 flex-1 flex-col md:flex',
            hasActiveThread ? 'flex' : 'hidden md:flex',
          )}
        >
          <Outlet />
        </section>
      </div>
    </main>
  )
}
