import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAccountLocaleSync } from '@/features/locale/useLocale'
import AcceptTermsModal from '@/components/legal/AcceptTermsModal'
import { cn } from '@/lib/cn'
import Navbar from './Navbar'
import MobileTabBar from './MobileTabBar'
import SiteFooter from './SiteFooter'
import VerifyEmailBanner from './VerifyEmailBanner'

const SIDEBAR_COLLAPSED_KEY = 'krihouse.sidebarCollapsed'

/**
 * App shell: nav, the verification reminder, the routed page, footer.
 * The page content sits in a plain <div> rather than a <main> because
 * each page renders its own <main> - nesting two would be invalid.
 *
 * Nav redesign: from `lg` up, Navbar renders as a left sidebar and this
 * component lays the page out as a real CSS GRID with two columns
 * (`lg:grid-cols-[16rem_1fr]`) - the sidebar is column 1, the page
 * content (pinned there with `lg:col-start-2`, see below) is column 2.
 * This replaced an earlier version that made the sidebar `position:
 * fixed` and tried to push the content over with matching padding
 * (`lg:ps-64`) - that relies on two numbers in two different files
 * always agreeing, and when they silently didn't, the fixed sidebar sat
 * on top of the page instead of beside it. A grid column can't have that
 * bug: the browser reserves its width automatically, so there is nothing
 * left to fall out of sync.
 *
 * Below `lg`, none of this grid applies - Navbar is just a slim top
 * strip and MobileTabBar adds a fixed bottom tab bar instead; `pb-16`
 * keeps page content clear of that fixed bar, cancelled again by
 * `lg:pb-0` once the bar is hidden.
 */
export default function AppLayout() {
  const { pathname } = useLocation()

  // Phase 27. THE one call site — see useAccountLocaleSync for why it
  // must not be called anywhere else. It adopts the language saved on the
  // account when someone signs in, so a person who chose Darija on their
  // phone gets Darija on their laptop too.
  useAccountLocaleSync()

  // A single-page app keeps the scroll position when the URL changes, so
  // clicking a card near the bottom of a list would open the next page
  // already scrolled down. This puts every new page back at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  // Desktop sidebar show/hide, remembered per browser. Read once on
  // mount; localStorage can throw in private browsing, so this fails
  // safe to "expanded" rather than crashing the whole app.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isSidebarCollapsed ? '1' : '0')
    } catch {
      // Best-effort only - losing this preference is not worth surfacing an error for.
    }
  }, [isSidebarCollapsed])

  return (
    <div
      className={cn(
        'min-h-screen bg-gray-50 lg:grid',
        isSidebarCollapsed ? 'lg:grid-cols-[0px_1fr]' : 'lg:grid-cols-[16rem_1fr]',
      )}
    >
      <Navbar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />

      {/* lg:col-start-2 pins this to the second column even when the
          sidebar isn't rendered at all (collapsed) and there is no
          column-1 item for the grid to place it after automatically. */}
      <div className="flex min-h-screen flex-col lg:col-start-2">
        <VerifyEmailBanner />
        <AcceptTermsModal />
        {/* key=pathname remounts on navigation, which is what replays the
            entrance animation. */}
        <div key={pathname} className="page-enter flex-1 pb-16 lg:pb-0">
          <Outlet />
        </div>
        {/* Hidden on mobile: MobileTabBar already covers the bottom of the
            screen there, and the footer's links (favorites, owner space,
            terms...) just repeat what's already reachable from the tab
            bar / the mobile header's "more" panel — it only added scroll
            for nothing. Desktop keeps it since the sidebar doesn't
            duplicate these links. */}
        <div className="hidden lg:block">
          <SiteFooter />
        </div>
      </div>

      <MobileTabBar />
    </div>
  )
}
