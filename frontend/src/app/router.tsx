import { createBrowserRouter } from 'react-router-dom'
import HomePage from '@/pages/HomePage'

/**
 * Route definitions. Kept as one small file for now (Phase 14) — auth
 * routes (Phase 15), property routes (Phase 16-17), etc. get added here
 * as their phases land, along with ProtectedRoute/OwnerRoute/AdminRoute
 * wrappers once there's an actual logged-in user to check.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
])
