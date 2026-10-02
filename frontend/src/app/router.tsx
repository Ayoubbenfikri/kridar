import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import OwnerLayout from '@/components/layout/OwnerLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import PropertiesPage from '@/pages/PropertiesPage'
import SupportPage from '@/pages/SupportPage'
import PropertyDetailsPage from '@/pages/PropertyDetailsPage'
import RoommateListingsPage from '@/pages/RoommateListingsPage'
import RoommateListingDetailsPage from '@/pages/RoommateListingDetailsPage'
import LeaveReviewPage from '@/pages/LeaveReviewPage'
import OwnerReplyPage from '@/pages/OwnerReplyPage'
import FavoritesPage from '@/pages/FavoritesPage'
import NotificationsPage from '@/pages/NotificationsPage'
import MessagesPage from '@/pages/MessagesPage'
import ConversationPage from '@/pages/ConversationPage'
import MyReservationsPage from '@/pages/MyReservationsPage'
import AccountPage from '@/pages/AccountPage'
import AccountSettingsPage from '@/pages/AccountSettingsPage'
import OwnerDashboardPage from '@/pages/OwnerDashboardPage'
import OwnerPropertiesPage from '@/pages/OwnerPropertiesPage'
import OwnerReservationsPage from '@/pages/OwnerReservationsPage'
import PropertyCreatePage from '@/pages/PropertyCreatePage'
import PropertyEditPage from '@/pages/PropertyEditPage'
import OwnerRoommateListingsPage from '@/pages/OwnerRoommateListingsPage'
import RoommateListingCreatePage from '@/pages/RoommateListingCreatePage'
import RoommateListingEditPage from '@/pages/RoommateListingEditPage'
import UiKitPage from '@/pages/UiKitPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import AdminUsersPage from '@/pages/AdminUsersPage'
import AdminPropertiesPage from '@/pages/AdminPropertiesPage'
import AdminRoommateListingsPage from '@/pages/AdminRoommateListingsPage'
import AdminPaymentsPage from '@/pages/AdminPaymentsPage'
import AdminSettingsPage from '@/pages/AdminSettingsPage'
import TermsOfUsePage from '@/pages/legal/TermsOfUsePage'
import PrivacyPolicyPage from '@/pages/legal/PrivacyPolicyPage'

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
      // Public, same as login/register - a locked-out user has no session
      // to gate either of these behind.
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'properties', element: <PropertiesPage /> },
      { path: 'ui', element: <UiKitPage /> },
      { path: 'properties/:id', element: <PropertyDetailsPage /> },
      // Shared Accommodation / Roommates (Phase R5) — public browse +
      // details, same as properties above. Create/edit/manage (Phase R6)
      // are the /owner/roommates* routes below, mirroring properties/new
      // and properties/:id/edit under /owner.
      { path: 'roommates', element: <RoommateListingsPage /> },
      { path: 'roommates/:id', element: <RoommateListingDetailsPage /> },
      // Public (Phase 28): anyone can support the project, and the page
      // works with no account and no payment method configured.
      { path: 'support', element: <SupportPage /> },
      // Public and outside ProtectedRoute on purpose: a visitor filling
      // in the registration form must be able to open these (RegisterForm
      // links to them, target="_blank") before they even have an account.
      { path: 'terms', element: <TermsOfUsePage /> },
      { path: 'privacy', element: <PrivacyPolicyPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'reservations/:reservationId/review', element: <LeaveReviewPage /> },
          { path: 'reviews/:reviewId/reply', element: <OwnerReplyPage /> },
          { path: 'favorites', element: <FavoritesPage /> },
          { path: 'reservations', element: <MyReservationsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          // Inbox, then one thread. Both need a session: a conversation
          // is private to its two participants (ConversationPolicy).
          { path: 'messages', element: <MessagesPage /> },
          { path: 'messages/:id', element: <ConversationPage /> },
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
              // Shared Accommodation / Roommates (Phase R6 part 2) — same
              // "list + new + edit" shape as properties above, just for
              // roommate posts. Not gated by property ownership even
              // though it lives under this layout: OwnerLayout itself
              // only requires being logged in (ProtectedRoute), the
              // stricter 'owner' middleware is applied per-route on the
              // backend, and these three routes don't carry it.
              { path: 'roommates', element: <OwnerRoommateListingsPage /> },
              { path: 'roommates/new', element: <RoommateListingCreatePage /> },
              { path: 'roommates/:id/edit', element: <RoommateListingEditPage /> },
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
              { path: 'roommate-listings', element: <AdminRoommateListingsPage /> },
              { path: 'payments', element: <AdminPaymentsPage /> },
              { path: 'settings', element: <AdminSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
