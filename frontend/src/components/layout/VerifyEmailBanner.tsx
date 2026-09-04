import { useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'

/**
 * The backend only enforces email verification on specific actions
 * (creating a property, booking, paying - see routes wrapped in
 * ['auth:sanctum', 'verified']), not on browsing. So this is a
 * dismissable-feeling reminder banner, not a page that blocks the app.
 */
export default function VerifyEmailBanner() {
  const { user, isAuthenticated, resendVerification } = useAuth()
  const [sent, setSent] = useState(false)

  if (!isAuthenticated || user?.email_verified) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
      Ton email n'est pas encore verifie.{' '}
      {sent ? (
        <span>Email envoye - verifie ta boite de reception.</span>
      ) : (
        <button
          onClick={() => resendVerification.mutate(undefined, { onSuccess: () => setSent(true) })}
          disabled={resendVerification.isPending}
          className="font-medium underline hover:no-underline disabled:opacity-50"
        >
          Renvoyer l'email de verification
        </button>
      )}
    </div>
  )
}
