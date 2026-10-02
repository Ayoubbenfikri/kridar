import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/layout/AuthLayout'
import ForgotPasswordForm from '@/features/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()

  return (
    <AuthLayout title={t('auth.forgotPasswordTitle')} subtitle={t('auth.forgotPasswordSubtitle')}>
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
