import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import VerifyEmailBanner from './VerifyEmailBanner'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <VerifyEmailBanner />
      <Outlet />
    </div>
  )
}
