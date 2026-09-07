import AuthLayout from '@/components/layout/AuthLayout'
import LoginForm from '@/features/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout title="Content de vous revoir" subtitle="Connectez-vous pour gerer vos reservations">
      <LoginForm />
    </AuthLayout>
  )
}
