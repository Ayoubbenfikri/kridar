import { useState } from 'react'
import { CheckCircle2, MailWarning } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'

/**
 * The backend only enforces email verification on specific actions
 * (creating a property, booking, paying - see routes wrapped in
 * ['auth:sanctum', 'verified']), not on browsing. So this is a
 * reminder banner, not a page that blocks the app.
 */
export default function VerifyEmailBanner() {
  const { user, isAuthenticated, resendVerification } = useAuth()
  const [sent, setSent] = useState(false)

  if (!isAuthenticated || user?.email_verified) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2.5 text-sm text-amber-800 sm:px-6">
        {sent ? (
          <>
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            <span>Email envoye - verifie ta boite de reception.</span>
          </>
        ) : (
          <>
            <MailWarning className="size-4 shrink-0" aria-hidden />
            <span>Ton email n'est pas encore verifie.</span>
            <button
              type="button"
              onClick={() => resendVerification.mutate(undefined, { onSuccess: () => setSent(true) })}
              disabled={resendVerification.isPending}
              className="font-semibold underline underline-offset-2 transition hover:no-underline disabled:opacity-50"
            >
              {resendVerification.isPending ? 'Envoi...' : "Renvoyer l'email"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
