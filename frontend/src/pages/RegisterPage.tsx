import AuthLayout from '@/components/layout/AuthLayout'
import RegisterForm from '@/features/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout title="Creer un compte" subtitle="Reservez un logement ou publiez le votre">
      <RegisterForm />
    </AuthLayout>
  )
}
