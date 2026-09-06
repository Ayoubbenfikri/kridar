import { useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'

/**
 * Phase 19 - edit profile (name/phone) and change password. Two
 * independent forms/mutations so an error in one never blocks the
 * other. Email is not editable here - see UpdateProfileRequest.
 */
export default function AccountSettingsPage() {
  const { user, updateProfile, updatePassword } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')

  function handleProfileSubmit(event: FormEvent) {
    event.preventDefault()
    updateProfile.mutate({ name, phone: phone || undefined })
  }

  function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    updatePassword.mutate(
      {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirmation,
      },
      {
        onSuccess: () => {
          setCurrentPassword('')
          setNewPassword('')
          setNewPasswordConfirmation('')
        },
      },
    )
  }

  const profileErrors = getValidationErrors(updateProfile.error)
  const passwordErrors = getValidationErrors(updatePassword.error)

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-brand-700">Parametres du compte</h1>

      <section className="mb-8 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-4 font-semibold text-gray-800">Profil</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Nom
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
              Telephone
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          {profileErrors && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {Object.values(profileErrors)
                .flat()
                .map((message) => (
                  <p key={message}>{message}</p>
                ))}
            </div>
          )}
          {updateProfile.isError && !profileErrors && (
            <p className="text-sm text-red-600">{getErrorMessage(updateProfile.error)}</p>
          )}
          {updateProfile.isSuccess && <p className="text-sm text-green-700">Profil mis a jour.</p>}

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-white transition hover:scale-[1.02] hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-4 font-semibold text-gray-800">Mot de passe</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="mb-1 block text-sm font-medium text-gray-700">
              Mot de passe actuel
            </label>
            <input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="new_password" className="mb-1 block text-sm font-medium text-gray-700">
              Nouveau mot de passe
            </label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="new_password_confirmation" className="mb-1 block text-sm font-medium text-gray-700">
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="new_password_confirmation"
              type="password"
              value={newPasswordConfirmation}
              onChange={(event) => setNewPasswordConfirmation(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          {passwordErrors && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {Object.values(passwordErrors)
                .flat()
                .map((message) => (
                  <p key={message}>{message}</p>
                ))}
            </div>
          )}
          {updatePassword.isError && !passwordErrors && (
            <p className="text-sm text-red-600">{getErrorMessage(updatePassword.error)}</p>
          )}
          {updatePassword.isSuccess && <p className="text-sm text-green-700">Mot de passe mis a jour.</p>}

          <button
            type="submit"
            disabled={updatePassword.isPending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-white transition hover:scale-[1.02] hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {updatePassword.isPending ? 'Enregistrement...' : 'Changer le mot de passe'}
          </button>
        </form>
      </section>
    </main>
  )
}
