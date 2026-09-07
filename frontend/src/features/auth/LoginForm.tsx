import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from './useAuth'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Input } from '@/components/ui'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const fieldErrors = getValidationErrors(login.error)
  const generalError = login.isError && !fieldErrors ? getErrorMessage(login.error) : null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    login.mutate({ email, password }, { onSuccess: () => navigate('/') })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        required
        autoComplete="email"
        placeholder="vous@exemple.com"
        icon={<Mail className="size-5" />}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors?.email?.[0]}
      />

      <Input
        label="Mot de passe"
        type={showPassword ? 'text' : 'password'}
        required
        autoComplete="current-password"
        icon={<Lock className="size-5" />}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors?.password?.[0]}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="flex size-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="size-4.5" aria-hidden /> : <Eye className="size-4.5" aria-hidden />}
          </button>
        }
      />

      {generalError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {generalError}
        </div>
      )}

      <Button type="submit" fullWidth isLoading={login.isPending}>
        {login.isPending ? 'Connexion...' : 'Se connecter'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold text-brand-600 transition hover:text-brand-700">
          S'inscrire
        </Link>
      </p>
    </form>
  )
}
