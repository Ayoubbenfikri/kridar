import { Outlet } from 'react-router-dom'
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
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <VerifyEmailBanner />
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  )
}
