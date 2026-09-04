import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import PropertiesPage from '@/pages/PropertiesPage'
import PropertyDetailsPage from '@/pages/PropertyDetailsPage'

/**
 * Route definitions. AppLayout wraps every page with the Navbar + the
 * "verify your email" banner. Reservation/dashboard/etc. routes get
 * added here as their phases land, some wrapped in ProtectedRoute once
 * there are actual pages that need it.
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
    ],
  },
])
