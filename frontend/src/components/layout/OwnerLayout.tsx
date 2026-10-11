import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, CalendarCheck, HeartHandshake, LayoutDashboard, Plus } from 'lucide-react'
import { buttonClasses } from '@/components/ui'
import { cn } from '@/lib/cn'

const LINKS = [
  { to: '/owner', labelKey: 'owner.nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/owner/properties', labelKey: 'owner.nav.properties', icon: Building2, end: false },
  // Phase R6 part 2 — same layout shell, own section: unlike Mes
  // propriétés, reaching this tab has nothing to do with owning a
  // property (see the routing note in router.tsx).
  { to: '/owner/roommates', labelKey: 'owner.nav.roommates', icon: HeartHandshake, end: false },
  { to: '/owner/reservations', labelKey: 'owner.nav.reservations', icon: CalendarCheck, end: false },
]

/**
 * Shell for every /owner page: a sidebar from `lg` up, a horizontal
 * scrollable tab row below that. It is a route layout (renders
 * <Outlet/>), so the sidebar is mounted once and does not re-render or
 * flash when you move between the owner pages.
 *
 * `end` on the dashboard link stops it staying active on the child
 * routes - without it, /owner would look active on /owner/properties.
 */
export default function OwnerLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  // The sidebar "Add" follows the section you are in: on the roommate
  // pages it creates a roommate post, everywhere else a property (it used
  // to always open the property form, even from "My roommate posts").
  const add = pathname.startsWith('/owner/roommates')
    ? { to: '/owner/roommates/new', label: t('roommateEdit.newTitle') }
    : { to: '/owner/properties/new', label: t('owner.properties.addProperty') }
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium whitespace-nowrap transition',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="lg:grid lg:grid-cols-[232px_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase lg:block">
            {t('owner.nav.label')}
          </p>

          {/* Scrollbar hidden on the mobile tab row: the tabs still scroll
              with a swipe, the grey bar under them was just noise. */}
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                <link.icon className="size-4.5 shrink-0" aria-hidden />
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>

          {/* Desktop only. Phase O1 fix: 'hidden' sat on the button itself,
              next to buttonClasses' own 'inline-flex' - same CSS property,
              and inline-flex won, so this showed on mobile too (two "Add"
              buttons on one screen). The wrapper owns the visibility now. */}
          <div className="mt-3 hidden lg:block">
            <Link to={add.to} className={buttonClasses({ size: 'sm', fullWidth: true })}>
              <Plus className="size-4" aria-hidden />
              {add.label}
            </Link>
          </div>
        </aside>

        <div className="mt-6 min-w-0 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
