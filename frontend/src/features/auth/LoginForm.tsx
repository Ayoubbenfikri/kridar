import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fieldErrors = getValidationErrors(login.error)
  const generalError = login.isError && !fieldErrors ? getErrorMessage(login.error) : null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    login.mutate({ email, password }, { onSuccess: () => navigate('/') })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-800">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        {fieldErrors?.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-brand-800">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        {fieldErrors?.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>}
      </div>

      {generalError && <p className="text-sm text-red-600">{generalError}</p>}

      <button
        type="submit"
        disabled={login.isPending}
        className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2 font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl hover:shadow-brand-900/40 active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
      >
        {login.isPending ? 'Connexion...' : 'Se connecter'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-brand-600 transition hover:underline">
          S'inscrire
        </Link>
      </p>
    </form>
  )
}
