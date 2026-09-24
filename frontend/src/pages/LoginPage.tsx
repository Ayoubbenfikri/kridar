import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/layout/AuthLayout'
import LoginForm from '@/features/auth/LoginForm'

export default function LoginPage() {
  const { t } = useTranslation()

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <LoginForm />
    </AuthLayout>
  )
}
