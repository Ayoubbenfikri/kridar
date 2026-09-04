import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'

/**
 * Wraps routes that require being logged in. Not used anywhere yet -
 * Phase 15 has no protected pages - ready for Phase 16+ ("create a
 * property", "my reservations", etc.).
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoadingUser } = useAuth()

  if (isLoadingUser) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
