import { NavLink, Outlet } from 'react-router-dom'
import { Building2, CalendarCheck, LayoutDashboard, Plus } from 'lucide-react'
import { buttonClasses } from '@/components/ui'
import { cn } from '@/lib/cn'

const LINKS = [
  { to: '/owner', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/owner/properties', label: 'Mes propriétés', icon: Building2, end: false },
  { to: '/owner/reservations', label: 'Réservations', icon: CalendarCheck, end: false },
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
            Propriétaire
          </p>

          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:px-0 lg:pb-0">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                <link.icon className="size-4.5 shrink-0" aria-hidden />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <NavLink
            to="/owner/properties/new"
            className={buttonClasses({ size: 'sm', className: 'mt-3 hidden w-full lg:inline-flex' })}
          >
            <Plus className="size-4" aria-hidden />
            Ajouter
          </NavLink>
        </aside>

        <div className="mt-6 min-w-0 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
