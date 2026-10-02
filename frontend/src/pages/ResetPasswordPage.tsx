import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/layout/AuthLayout'
import ResetPasswordForm from '@/features/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  const { t } = useTranslation()

  return (
    <AuthLayout title={t('auth.resetPasswordTitle')} subtitle={t('auth.resetPasswordSubtitle')}>
      <ResetPasswordForm />
    </AuthLayout>
  )
}
