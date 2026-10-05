import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, AlertTriangle, ArrowLeft, Camera, CheckCircle2, Lock, Phone, Trash2, User } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Card, Input, UserAvatar } from '@/components/ui'

// Mirrors the backend's UpdateAvatarRequest rules (image, jpeg/png/webp,
// max 2048 KB) so an obviously-bad file is rejected instantly instead of
// after a round trip. The backend still re-validates everything itself -
// this check is UX only, never a substitute for it.
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR_SIZE_BYTES = 2048 * 1024

/**
 * /account/settings - profile (name, phone) and password, as two
 * independent forms: each submits on its own and reports its own
 * result, so a failed password change never loses a typed name.
 */
export default function AccountSettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, updateProfile, updatePassword, deleteAccount, uploadAvatar, deleteAvatar } = useAuth()

  const fileInputRef = useRef<HTMLInputElement>(null)
  // Local, not derived from the mutations' own isError/isSuccess - two
  // mutations (upload, delete) share this one card, and tracking the
  // notice ourselves avoids a stale "photo updated" message lingering
  // after a later delete (or vice versa).
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [showPhone, setShowPhone] = useState(user?.show_phone_on_listings ?? false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')

  // Two-step reveal: the danger zone starts as just a warning + a button,
  // and only shows the confirmation field + the real "confirm" button
  // once that button has been clicked. No window.confirm() popup - this
  // stays inside the page instead of a browser dialog.
  // What the user must type, exactly, before the delete button is enabled.
  // Translated (SUPPRIMER / DELETE / مسح), uppercased in the UI as a
  // "this is serious" cue, and compared case-insensitively.
  const deleteWord = t('accountSettings.danger.word').toUpperCase()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const isDeleteConfirmTextValid =
    deleteConfirmText.trim().toUpperCase() === deleteWord

  const profileErrors = getValidationErrors(updateProfile.error)
  const passwordErrors = getValidationErrors(updatePassword.error)

  const hasPhone = phone.trim() !== ''

  function handleProfileSubmit(event: FormEvent) {
    event.preventDefault()

    updateProfile.mutate({
      name,
      // null, not undefined. undefined drops the key from the request,
      // the backend then leaves the column alone, and an emptied field
      // could never actually remove a number.
      phone: hasPhone ? phone.trim() : null,
      // Nothing to show without a number, so consent is switched off
      // with it rather than left pointing at nothing.
      show_phone_on_listings: hasPhone && showPhone,
    })
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

  function handleDeleteSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isDeleteConfirmTextValid) return

    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        // Clearing the cache (useAuth) alone doesn't move the user off
        // this page on its own - nothing here re-reads it until
        // something forces a re-render. Navigating explicitly is what
        // makes the deletion feel instant instead of needing a refresh.
        navigate('/', { replace: true })
      },
    })
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Lets the same file be picked again later (e.g. re-selecting after
    // an error) - without this, a second pick of the identical file
    // would not fire onChange at all.
    event.target.value = ''
    if (!file) return

    setAvatarNotice(null)

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError(t('accountSettings.avatar.unsupportedFormat'))
      return
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError(t('accountSettings.avatar.tooLarge'))
      return
    }

    setAvatarError(null)
    uploadAvatar.mutate(file, {
      onSuccess: () => setAvatarNotice(t('accountSettings.avatar.updated')),
    })
  }

  function handleRemoveAvatar() {
    setAvatarError(null)
    setAvatarNotice(null)
    deleteAvatar.mutate(undefined, {
      onSuccess: () => setAvatarNotice(t('accountSettings.avatar.removed')),
    })
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/account"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('accountSettings.back')}
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{t('accountSettings.title')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('accountSettings.subtitle')}</p>

      {/* ---------------- Photo de profil ---------------- */}
      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="font-semibold text-gray-900">{t('accountSettings.avatar.title')}</h2>
        <p className="mt-0.5 mb-5 text-sm text-gray-500">
          {t('accountSettings.avatar.description')}
        </p>

        <div className="flex items-center gap-4">
          <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} seed={user?.id ?? 0} size="xl" />

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                icon={<Camera className="size-4" aria-hidden />}
                isLoading={uploadAvatar.isPending}
                disabled={deleteAvatar.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {user?.avatar_url ? t('accountSettings.avatar.change') : t('accountSettings.avatar.add')}
              </Button>

              {user?.avatar_url && (
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Trash2 className="size-4" aria-hidden />}
                  isLoading={deleteAvatar.isPending}
                  disabled={uploadAvatar.isPending}
                  onClick={handleRemoveAvatar}
                >
                  {t('accountSettings.avatar.remove')}
                </Button>
              )}
            </div>

            {/* Hidden input, triggered by the buttons above - a native
                file picker can't be styled, so this is how every custom
                "upload a photo" button is built. */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <p className="text-xs text-gray-500">{t('accountSettings.avatar.hint')}</p>
          </div>
        </div>

        {(avatarError || uploadAvatar.isError || deleteAvatar.isError) && (
          <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {avatarError ?? getErrorMessage(uploadAvatar.error ?? deleteAvatar.error)}
          </p>
        )}
        {avatarNotice && !avatarError && (
          <p className="mt-3 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            {avatarNotice}
          </p>
        )}
      </Card>

      {/* ---------------- Profile ---------------- */}
      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="font-semibold text-gray-900">{t('accountSettings.profile.title')}</h2>
        <p className="mt-0.5 mb-5 text-sm text-gray-500">
          {t('accountSettings.profile.description')}
        </p>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label={t('accountSettings.profile.name')}
            required
            icon={<User className="size-5" />}
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={profileErrors?.name?.[0]}
          />

          <Input
            label={t('accountSettings.profile.phone')}
            type="tel"
            icon={<Phone className="size-5" />}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={profileErrors?.phone?.[0]}
            hint={t('accountSettings.profile.phoneHint')}
          />

          {/* Consent, not a preference: nothing is shown until this is
              ticked, and it only ever applies to long-term listings. */}
          <label
            className={
              hasPhone
                ? 'flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-gray-300'
                : 'flex cursor-not-allowed items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 opacity-60'
            }
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-brand-600"
              checked={hasPhone && showPhone}
              disabled={!hasPhone}
              onChange={(event) => setShowPhone(event.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium text-gray-900">
                {t('accountSettings.profile.showPhone')}
              </span>
              <span className="mt-0.5 block text-gray-500">
                {hasPhone
                  ? t('accountSettings.profile.showPhoneOn')
                  : t('accountSettings.profile.showPhoneOff')}
              </span>
            </span>
          </label>

          <Input label={t('accountSettings.profile.email')} value={user?.email ?? ''} disabled />

          {updateProfile.isError && !profileErrors && (
            <p className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {getErrorMessage(updateProfile.error)}
            </p>
          )}
          {updateProfile.isSuccess && (
            <p className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              {t('accountSettings.profile.updated')}
            </p>
          )}

          <Button type="submit" isLoading={updateProfile.isPending}>
            {updateProfile.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </form>
      </Card>

      {/* ---------------- Password ---------------- */}
      <Card className="mt-5 p-5 sm:p-6">
        <h2 className="font-semibold text-gray-900">{t('accountSettings.password.title')}</h2>
        <p className="mt-0.5 mb-5 text-sm text-gray-500">
          {t('accountSettings.password.description')}
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label={t('accountSettings.password.current')}
            type="password"
            required
            autoComplete="current-password"
            icon={<Lock className="size-5" />}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={passwordErrors?.current_password?.[0]}
          />

          <Input
            label={t('accountSettings.password.new')}
            type="password"
            required
            autoComplete="new-password"
            icon={<Lock className="size-5" />}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={passwordErrors?.password?.[0]}
            hint={t('accountSettings.password.newHint')}
          />

          <Input
            label={t('accountSettings.password.confirm')}
            type="password"
            required
            autoComplete="new-password"
            icon={<Lock className="size-5" />}
            value={newPasswordConfirmation}
            onChange={(event) => setNewPasswordConfirmation(event.target.value)}
            error={
              newPasswordConfirmation && newPasswordConfirmation !== newPassword
                ? t('accountSettings.password.mismatch')
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
              {t('accountSettings.password.updated')}
            </p>
          )}

          <Button type="submit" isLoading={updatePassword.isPending}>
            {updatePassword.isPending ? t('common.saving') : t('accountSettings.password.submit')}
          </Button>
        </form>
      </Card>

      {/* ---------------- Danger zone ---------------- */}
      {/* border-l-4 (not a border-color override) - Card's `cn` helper is
          a plain string join with no Tailwind conflict resolution, so
          fighting its own `border-gray-200` here would be a coin flip on
          which class wins. A left accent never collides with it. */}
      <Card className="mt-5 border-l-4 border-l-red-400 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold text-red-700">
          <AlertTriangle className="size-5" aria-hidden />
          {t('accountSettings.danger.title')}
        </h2>
        <p className="mt-0.5 mb-5 text-sm text-gray-500">
          {t('accountSettings.danger.description')}
        </p>

        {!showDeleteConfirm && (
          <Button
            type="button"
            variant="danger"
            icon={<Trash2 className="size-4" aria-hidden />}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('accountSettings.danger.title')}
          </Button>
        )}

        {showDeleteConfirm && (
          <form onSubmit={handleDeleteSubmit} className="space-y-4">
            <Input
              label={t('accountSettings.danger.confirmLabel', { word: deleteWord })}
              type="text"
              required
              autoComplete="off"
              placeholder={deleteWord}
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
            />

            {deleteAccount.isError && (
              <p className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {getErrorMessage(deleteAccount.error)}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                variant="danger"
                isLoading={deleteAccount.isPending}
                disabled={!isDeleteConfirmTextValid}
              >
                {deleteAccount.isPending
                  ? t('accountSettings.danger.deleting')
                  : t('accountSettings.danger.confirm')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                disabled={deleteAccount.isPending}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </main>
  )
}
