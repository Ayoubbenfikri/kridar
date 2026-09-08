import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import SiteFooter from './SiteFooter'
import VerifyEmailBanner from './VerifyEmailBanner'

/**
 * App shell: navbar, the verification reminder, the routed page, footer.
 * The page content sits in a plain <div> rather than a <main> because
 * each page renders its own <main> - nesting two would be invalid.
 * flex-col + flex-1 keeps the footer at the bottom on short pages.
 */
export default function AppLayout() {
  const { pathname } = useLocation()

  // A single-page app keeps the scroll position when the URL changes, so
  // clicking a card near the bottom of a list would open the next page
  // already scrolled down. This puts every new page back at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <VerifyEmailBanner />
      {/* key=pathname remounts on navigation, which is what replays the
          entrance animation. */}
      <div key={pathname} className="page-enter flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  )
}
