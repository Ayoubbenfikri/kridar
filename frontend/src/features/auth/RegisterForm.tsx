import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react'
import { useAuth } from './useAuth'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Input } from '@/components/ui'

export default function RegisterForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const fieldErrors = getValidationErrors(register.error)
  // Backend text, already in the right language — see LoginForm.
  const generalError = register.isError && !fieldErrors ? getErrorMessage(register.error) : null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('auth.fullName')}
        required
        autoComplete="name"
        placeholder={t('auth.namePlaceholder')}
        icon={<User className="size-5" />}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors?.name?.[0]}
      />

      <Input
        label={t('auth.email')}
        type="email"
        required
        autoComplete="email"
        placeholder={t('auth.emailPlaceholder')}
        icon={<Mail className="size-5" />}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors?.email?.[0]}
      />

      <Input
        label={t('auth.phone')}
        type="tel"
        autoComplete="tel"
        placeholder={t('auth.phonePlaceholder')}
        icon={<Phone className="size-5" />}
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        error={fieldErrors?.phone?.[0]}
      />

      <Input
        label={t('auth.password')}
        type={showPassword ? 'text' : 'password'}
        required
        autoComplete="new-password"
        icon={<Lock className="size-5" />}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors?.password?.[0]}
        // Laravel's Password::defaults() is not customised in this app,
        // so the rule really is 8 characters minimum.
        hint={t('auth.passwordHint')}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            className="flex size-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="size-4.5" aria-hidden /> : <Eye className="size-4.5" aria-hidden />}
          </button>
        }
      />

      <Input
        label={t('auth.confirmPassword')}
        type={showPassword ? 'text' : 'password'}
        required
        autoComplete="new-password"
        icon={<Lock className="size-5" />}
        value={passwordConfirmation}
        onChange={(event) => setPasswordConfirmation(event.target.value)}
        // Checked here rather than server-side only, so the person sees it
        // while typing instead of after a round trip.
        error={
          passwordConfirmation && passwordConfirmation !== password
            ? t('auth.passwordsDoNotMatch')
            : undefined
        }
      />

      {generalError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {generalError}
        </div>
      )}

      <Button type="submit" fullWidth isLoading={register.isPending}>
        {register.isPending ? t('auth.registering') : t('auth.register')}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-brand-600 transition hover:text-brand-700">
          {t('auth.login')}
        </Link>
      </p>
    </form>
  )
}
