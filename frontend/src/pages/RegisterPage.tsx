import RegisterForm from '@/features/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold text-brand-800">Creer un compte</h1>
      <RegisterForm />
    </main>
  )
}
