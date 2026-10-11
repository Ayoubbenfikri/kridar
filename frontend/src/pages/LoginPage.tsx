import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/layout/AuthLayout'
import LoginForm from '@/features/auth/LoginForm'
import { REDIRECT_PARAM, safeRedirect } from '@/lib/safeRedirect'

export default function LoginPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  // Phase O1: someone sent here by an owner page (an owner ad, "Publish
  // my property") reads why they need an account, not "book a stay".
  const isOwner = safeRedirect(searchParams.get(REDIRECT_PARAM)).startsWith('/owner')

  return (
    <AuthLayout title={t(isOwner ? 'auth.loginOwnerTitle' : 'auth.loginTitle')}
      subtitle={t(isOwner ? 'auth.loginOwnerSubtitle' : 'auth.loginSubtitle')}
    >
      <LoginForm />
    </AuthLayout>
  )
}
