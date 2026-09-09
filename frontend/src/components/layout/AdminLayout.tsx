import { NavLink, Outlet } from 'react-router-dom'
import { Building2, LayoutDashboard, ShieldCheck, Users } from 'lucide-react'
import { cn } from '@/lib/cn'

const LINKS = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users, end: false },
  { to: '/admin/properties', label: 'Propriétés', icon: Building2, end: false },
]

/**
 * Shell for every /admin page - same shape as OwnerLayout so the two
 * back-offices behave identically, with a badge making it obvious which
 * one you are in. Route layout, so the sidebar mounts once.
 */
export default function AdminLayout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium whitespace-nowrap transition',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="lg:grid lg:grid-cols-[232px_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <span className="mb-4 hidden items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold tracking-wider text-white uppercase lg:inline-flex">
            <ShieldCheck className="size-4" aria-hidden />
            Administration
          </span>

          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:px-0 lg:pb-0">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                <link.icon className="size-4.5 shrink-0" aria-hidden />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="mt-6 min-w-0 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
