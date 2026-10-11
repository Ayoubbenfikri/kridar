import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { withRedirect } from '@/lib/safeRedirect'

/**
 * Wraps every route that requires being logged in.
 *
 * Phase O1: the page the visitor was trying to open goes along as
 * ?redirect=..., so login/register/Google bring them straight back to it
 * (see lib/safeRedirect). The owner pages (/owner...) send to /register
 * rather than /login: someone landing there from an owner ad usually has
 * no account yet, and the register page links to login anyway.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoadingUser } = useAuth()
  const location = useLocation()

  if (isLoadingUser) return null

  if (!isAuthenticated) {
    const target = location.pathname + location.search
    const authPage = location.pathname.startsWith('/owner') ? '/register' : '/login'
    return <Navigate to={withRedirect(authPage, target)} replace />
  }

  return <Outlet />
}
