import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'

export default function RegisterForm() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const fieldErrors = getValidationErrors(register.error)
  const generalError = register.isError && !fieldErrors ? getErrorMessage(register.error) : null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    register.mutate(
      {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        phone: phone || undefined,
      },
      { onSuccess: () => navigate('/') },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-brand-800">
          Nom complet
        </label>
        <input
          id="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        {fieldErrors?.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>}
      </div>

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
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-brand-800">
          Telephone (optionnel)
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        {fieldErrors?.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone[0]}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-brand-800">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        {fieldErrors?.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>}
      </div>

      <div>
        <label htmlFor="password_confirmation" className="mb-1 block text-sm font-medium text-brand-800">
          Confirmer le mot de passe
        </label>
        <input
          id="password_confirmation"
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {generalError && <p className="text-sm text-red-600">{generalError}</p>}

      <button
        type="submit"
        disabled={register.isPending}
        className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2 font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl hover:shadow-brand-900/40 active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
      >
        {register.isPending ? 'Inscription...' : "S'inscrire"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Deja un compte ?{' '}
        <Link to="/login" className="text-brand-600 transition hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
