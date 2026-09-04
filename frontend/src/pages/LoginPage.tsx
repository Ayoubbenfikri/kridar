import LoginForm from '@/features/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold text-brand-800">Connexion</h1>
      <LoginForm />
    </main>
  )
}
