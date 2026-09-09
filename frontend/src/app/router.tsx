import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import OwnerLayout from '@/components/layout/OwnerLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import PropertiesPage from '@/pages/PropertiesPage'
import PropertyDetailsPage from '@/pages/PropertyDetailsPage'
import LeaveReviewPage from '@/pages/LeaveReviewPage'
import OwnerReplyPage from '@/pages/OwnerReplyPage'
import FavoritesPage from '@/pages/FavoritesPage'
import NotificationsPage from '@/pages/NotificationsPage'
import MyReservationsPage from '@/pages/MyReservationsPage'
import AccountPage from '@/pages/AccountPage'
import AccountSettingsPage from '@/pages/AccountSettingsPage'
import OwnerDashboardPage from '@/pages/OwnerDashboardPage'
import OwnerPropertiesPage from '@/pages/OwnerPropertiesPage'
import OwnerReservationsPage from '@/pages/OwnerReservationsPage'
import PropertyCreatePage from '@/pages/PropertyCreatePage'
import PropertyEditPage from '@/pages/PropertyEditPage'
import UiKitPage from '@/pages/UiKitPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import AdminUsersPage from '@/pages/AdminUsersPage'
import AdminPropertiesPage from '@/pages/AdminPropertiesPage'

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
      { path: 'ui', element: <UiKitPage /> },
      { path: 'properties/:id', element: <PropertyDetailsPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'reservations/:reservationId/review', element: <LeaveReviewPage /> },
          { path: 'reviews/:reviewId/reply', element: <OwnerReplyPage /> },
          { path: 'favorites', element: <FavoritesPage /> },
          { path: 'reservations', element: <MyReservationsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'account', element: <AccountPage /> },
          { path: 'account/settings', element: <AccountSettingsPage /> },
          {
            // Every /owner page shares the same sidebar shell, so it is
            // mounted once here instead of being repeated per page.
            path: 'owner',
            element: <OwnerLayout />,
            children: [
              { index: true, element: <OwnerDashboardPage /> },
              { path: 'properties', element: <OwnerPropertiesPage /> },
              { path: 'reservations', element: <OwnerReservationsPage /> },
              { path: 'properties/new', element: <PropertyCreatePage /> },
              { path: 'properties/:id/edit', element: <PropertyEditPage /> },
            ],
          },
          {
            // Same shape as the owner section. The 'admin' middleware
            // (EnsureUserIsAdmin) is what really guards these endpoints;
            // this route only decides what gets rendered.
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: 'users', element: <AdminUsersPage /> },
              { path: 'properties', element: <AdminPropertiesPage /> },
            ],
          },
        ],
      },
    ],
  },
])
