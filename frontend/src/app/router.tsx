import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import PropertiesPage from '@/pages/PropertiesPage'
import PropertyDetailsPage from '@/pages/PropertyDetailsPage'
import LeaveReviewPage from '@/pages/LeaveReviewPage'
import OwnerReplyPage from '@/pages/OwnerReplyPage'
import FavoritesPage from '@/pages/FavoritesPage'

/**
 * Route definitions. AppLayout wraps every page with the Navbar + the
 * "verify your email" banner. ProtectedRoute redirects to /login when
 * not authenticated - used here for the two standalone review-action
 * pages (no dashboard yet to put them behind, see LeaveReviewPage).
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'properties', element: <PropertiesPage /> },
      { path: 'properties/:id', element: <PropertyDetailsPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'reservations/:reservationId/review', element: <LeaveReviewPage /> },
          { path: 'reviews/:reviewId/reply', element: <OwnerReplyPage /> },
          { path: 'favorites', element: <FavoritesPage /> },
        ],
      },
    ],
  },
])
