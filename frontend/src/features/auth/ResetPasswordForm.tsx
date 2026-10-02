import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from './useAuth'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Input } from '@/components/ui'

export default function ResetPasswordForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword } = useAuth()

  // Both come from the link the user clicked - see AppServiceProvider on
  // the backend for how that URL is built. Read once on mount; this page
  // never changes them itself.
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const fieldErrors = getValidationErrors(resetPassword.error)
  // Backend text, already in the right language - see LoginForm.
  const generalError = resetPassword.isError && !fieldErrors ? getErrorMessage(resetPassword.error) : null

  // The link is missing its token/email (opened by hand, forwarded
  // without the query string, etc.) - nothing to submit, so this is
  // caught here instead of letting the backend reject an incomplete
  // request.
  if (!token || !email) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-start text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('auth.invalidResetLink')}
        </div>
        <Link
          to="/forgot-password"
          className="inline-block text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          {t('auth.forgotPasswordLink')}
        </Link>
      </div>
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    resetPassword.mutate(
      { token, email, password, password_confirmation: passwordConfirmation },
      { onSuccess: () => navigate('/login') },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('auth.newPassword')}
        type={showPassword ? 'text' : 'password'}
        required
        autoComplete="new-password"
        hint={t('auth.passwordHint')}
        icon={<Lock className="size-5" />}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors?.password?.[0]}
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
        error={fieldErrors?.password_confirmation?.[0]}
      />

      {generalError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {generalError}
        </div>
      )}

      <Button type="submit" fullWidth isLoading={resetPassword.isPending}>
        {resetPassword.isPending ? t('auth.resettingPassword') : t('auth.resetPasswordSubmit')}
      </Button>
    </form>
  )
}
