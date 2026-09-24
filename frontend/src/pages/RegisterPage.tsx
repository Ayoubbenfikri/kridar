import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/layout/AuthLayout'
import RegisterForm from '@/features/auth/RegisterForm'

export default function RegisterPage() {
  const { t } = useTranslation()

  return (
    <AuthLayout title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <RegisterForm />
    </AuthLayout>
  )
}
