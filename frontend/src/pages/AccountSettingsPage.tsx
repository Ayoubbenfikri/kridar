import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Lock, Phone, User } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Card, Input } from '@/components/ui'

/**
 * /account/settings - profile (name, phone) and password, as two
 * independent forms: each submits on its own and reports its own
 * result, so a failed password change never loses a typed name.
 */
export default function AccountSettingsPage() {
  const { user, updateProfile, updatePassword } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')

  const profileErrors = getValidationErrors(updateProfile.error)
  const passwordErrors = getValidationErrors(updatePassword.error)

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

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/account"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mon compte
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">Paramètres</h1>
      <p className="mt-1 text-sm text-gray-500">Vos informations et votre mot de passe</p>

      {/* ---------------- Profile ---------------- */}
      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="font-semibold text-gray-900">Profil</h2>
        <p className="mt-0.5 mb-5 text-sm text-gray-500">
          L'adresse email ne peut pas être modifiée ici.
        </p>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Nom complet"
            required
            icon={<User className="size-5" />}
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={profileErrors?.name?.[0]}
          />

          <Input
            label="Téléphone (optionnel)"
            type="tel"
            icon={<Phone className="size-5" />}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={profileErrors?.phone?.[0]}
          />

          <Input label="Email" value={user?.email ?? ''} disabled />

          {updateProfile.isError && !profileErrors && (
            <p className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {getErrorMessage(updateProfile.error)}
            </p>
          )}
          {updateProfile.isSuccess && (
            <p className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              Profil mis à jour.
            </p>
          )}

          <Button type="submit" isLoading={updateProfile.isPending}>
            {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </Card>

      {/* ---------------- Password ---------------- */}
      <Card className="mt-5 p-5 sm:p-6">
        <h2 className="font-semibold text-gray-900">Mot de passe</h2>
        <p className="mt-0.5 mb-5 text-sm text-gray-500">
          Le mot de passe actuel est demandé pour confirmer que c'est bien vous.
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Mot de passe actuel"
            type="password"
            required
            autoComplete="current-password"
            icon={<Lock className="size-5" />}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={passwordErrors?.current_password?.[0]}
          />

          <Input
            label="Nouveau mot de passe"
            type="password"
            required
            autoComplete="new-password"
            icon={<Lock className="size-5" />}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={passwordErrors?.password?.[0]}
            hint="8 caracteres minimum"
          />

          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            required
            autoComplete="new-password"
            icon={<Lock className="size-5" />}
            value={newPasswordConfirmation}
            onChange={(event) => setNewPasswordConfirmation(event.target.value)}
            error={
              newPasswordConfirmation && newPasswordConfirmation !== newPassword
                ? 'Les deux mots de passe ne correspondent pas.'
                : undefined
            }
          />

          {updatePassword.isError && !passwordErrors && (
            <p className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {getErrorMessage(updatePassword.error)}
            </p>
          )}
          {updatePassword.isSuccess && (
            <p className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              Mot de passe mis à jour.
            </p>
          )}

          <Button type="submit" isLoading={updatePassword.isPending}>
            {updatePassword.isPending ? 'Enregistrement...' : 'Changer le mot de passe'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
