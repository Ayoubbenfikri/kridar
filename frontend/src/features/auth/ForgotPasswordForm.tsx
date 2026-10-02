import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Mail } from 'lucide-react'
import { useAuth } from './useAuth'
import { getValidationErrors } from '@/lib/apiErrors'
import { Button, Input } from '@/components/ui'

export default function ForgotPasswordForm() {
  const { t } = useTranslation()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')

  const fieldErrors = getValidationErrors(forgotPassword.error)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    forgotPassword.mutate({ email })
  }

  // Success replaces the form entirely rather than showing a message
  // alongside it. The backend's response is the same generic sentence
  // whether or not the email belongs to a real account
  // (AuthController::forgotPassword) - there's nothing left for the form
  // to do once it's shown, and leaving the form up would just invite a
  // second, redundant submit.
  if (forgotPassword.isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-gray-600">{forgotPassword.data.message}</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t('auth.backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <Button type="submit" fullWidth isLoading={forgotPassword.isPending}>
        {forgotPassword.isPending ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
      </Button>

      <p className="text-center text-sm text-gray-500">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-brand-600 transition hover:text-brand-700"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {t('auth.backToLogin')}
        </Link>
      </p>
    </form>
  )
}
