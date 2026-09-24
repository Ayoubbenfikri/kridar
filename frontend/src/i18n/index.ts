import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { fr } from './fr'
import { en } from './en'
import { ary } from './ary'

/**
 * i18next setup (Phase 27).
 *
 * Imported once, for its side effects, at the top of main.tsx — before
 * anything renders, so no component ever sees a half-initialised i18n.
 *
 * The three language codes here must match App\Enums\Locale on the
 * backend exactly: they are the directory names under backend/lang/, the
 * value stored in users.locale, and what goes out in Accept-Language.
 */

export const LOCALES = ['fr', 'en', 'ary'] as const

export type LocaleCode = (typeof LOCALES)[number]

/**
 * Darija is written in Arabic script. This is the frontend's copy of
 * App\Enums\Locale::isRtl() — one entry, and the only place the frontend
 * decides what mirrors.
 */
const RTL_LOCALES: readonly LocaleCode[] = ['ary']

export function isRtl(code: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(code)
}

export function isLocale(value: unknown): value is LocaleCode {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

const STORAGE_KEY = 'kridar.locale'

/**
 * Read the remembered language.
 *
 * Wrapped in try/catch because localStorage throws outright in a few
 * real situations — Safari private browsing, a browser set to block site
 * data — and a language preference is never worth a blank page.
 */
export function readStoredLocale(): LocaleCode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    return null
  }
}

export function writeStoredLocale(code: LocaleCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Not being able to remember the choice is a small loss; crashing
    // over it is not acceptable. The account column covers logged-in
    // users anyway.
  }
}

/**
 * What to start in, before we know who is looking:
 *   1. what this browser chose last time
 *   2. what the browser itself is set to, if we speak it
 *   3. French
 *
 * Once a logged-in user's profile arrives, useAccountLocaleSync() may
 * override this with the language saved on their account.
 */
function initialLocale(): LocaleCode {
  const stored = readStoredLocale()
  if (stored) return stored

  // navigator.language looks like 'fr-FR' or 'en-US'. Try the full tag
  // first (so a future 'ary' from a device set to Darija is honoured),
  // then the bare language.
  const preferred = typeof navigator === 'undefined' ? '' : (navigator.language ?? '')

  if (isLocale(preferred)) return preferred
  if (isLocale(preferred.slice(0, 2))) return preferred.slice(0, 2) as LocaleCode

  return 'fr'
}

/**
 * Keep <html lang> and <html dir> in step with the language.
 *
 * `dir` is what does most of the RTL work: flexbox, grid and text
 * alignment all flip from this one attribute, which is why the codebase
 * only needed its ~35 explicitly directional utilities converted to
 * logical ones rather than a full rewrite.
 *
 * `lang` is what index.css keys the Arabic font off, and what a screen
 * reader uses to pick a voice.
 */
function applyDocumentLocale(code: string): void {
  if (typeof document === 'undefined') return

  document.documentElement.lang = code
  document.documentElement.dir = isRtl(code) ? 'rtl' : 'ltr'
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ary: { translation: ary },
  },
  lng: initialLocale(),

  // French, matching App\Enums\Locale::default(). Kridar is a Moroccan
  // product written in French; English is not the neutral choice here.
  fallbackLng: 'fr',

  // React escapes everything it renders already. Leaving i18next's own
  // escaping on would double-escape an apostrophe in "S'inscrire".
  interpolation: { escapeValue: false },
})

// Registered on i18next rather than inside a React effect so it cannot be
// forgotten by a component that changes the language without rendering
// the one component that was doing the syncing.
i18n.on('languageChanged', applyDocumentLocale)
applyDocumentLocale(i18n.language)

export default i18n
