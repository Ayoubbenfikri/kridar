import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/useAuth'
import { isLocale, writeStoredLocale } from '@/i18n'
import type { LocaleCode } from '@/i18n'

/**
 * Reading and changing the interface language (Phase 27).
 *
 * Switching is deliberately OPTIMISTIC and never blocks on the network:
 * i18next changes first, so the interface flips instantly, and the save
 * to the account is fire-and-forget. If that save fails the person still
 * gets the language they asked for — localStorage has it — and the next
 * switch will try again. A language toggle that spins is a broken
 * language toggle.
 */
export function useLocale() {
  const { i18n } = useTranslation()
  const { isAuthenticated, updateLocale } = useAuth()

  // i18n.language can carry a region ('fr-FR') if a browser handed one
  // over, so it is narrowed rather than trusted.
  const current: LocaleCode = isLocale(i18n.language) ? i18n.language : 'fr'

  function setLocale(next: LocaleCode): void {
    if (next === current) return

    // 1. The interface, now. This also updates <html lang> and <html dir>
    //    through the listener registered in src/i18n/index.ts, which is
    //    what flips the whole layout for Darija.
    void i18n.changeLanguage(next)

    // 2. This browser, so a reload and a logged-out visit remember it.
    writeStoredLocale(next)

    // 3. The account, so it follows them to another device and so a
    //    notification email knows what to send. Only for someone who has
    //    an account to save it to.
    if (isAuthenticated) {
      updateLocale.mutate(next)
    }
  }

  return { current, setLocale }
}

/**
 * Adopt the language saved on the account, once, when a user's profile
 * arrives. Mounted in AppLayout — CALL IT EXACTLY ONCE in the tree.
 *
 * Why it is not inside useLocale(): useLocale is used by the switcher and
 * will be used by the settings page, and an adoption effect running in
 * two places at once fights itself. More importantly it would fight the
 * USER: switching to English updates the profile cache a moment later, and
 * a naive "profile changed → apply profile language" effect would read the
 * stale French value in between and snap the interface back.
 *
 * Keying on the user's id rather than on their locale is what avoids that:
 * the language is adopted once per person signing in, and a later change
 * by that same person is left alone. Logging out clears the marker, so the
 * next account is adopted properly rather than inheriting the last one's.
 */
export function useAccountLocaleSync(): void {
  const { i18n } = useTranslation()
  const { user } = useAuth()

  const syncedForUserId = useRef<number | null>(null)

  useEffect(() => {
    if (!user) {
      syncedForUserId.current = null
      return
    }

    if (syncedForUserId.current === user.id) return
    syncedForUserId.current = user.id

    if (isLocale(user.locale) && user.locale !== i18n.language) {
      void i18n.changeLanguage(user.locale)
      writeStoredLocale(user.locale)
    }
  }, [user, i18n])
}
