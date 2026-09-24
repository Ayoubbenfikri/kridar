import { useTranslation } from 'react-i18next'
import { useLocale } from '@/features/locale/useLocale'
import { LOCALES } from '@/i18n'
import type { LocaleCode } from '@/i18n'
import { cn } from '@/lib/cn'

/**
 * The language picker: three buttons in a pill, not a dropdown.
 *
 * With exactly three languages a segmented control is better than a
 * <select>: every option is visible without a click (so people discover
 * that Darija exists), there is no open/close state, and no outside-click
 * or Escape handling to get wrong — the navbar already carries one
 * dropdown and a second would be two things to keep dismissing.
 *
 * `compact` is for the navbar bar itself (FR · EN · دارجة). Without it
 * the full language names are shown, for the mobile panel where there is
 * room and a two-letter code next to full-width rows looks like a bug.
 */
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const { current, setLocale } = useLocale()

  const labelFor = (code: LocaleCode): string =>
    compact ? t(`language.${code}Short`) : t(`language.${code}`)

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={cn(
        'flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5',
        !compact && 'w-full',
      )}
    >
      {LOCALES.map((code) => {
        const isCurrent = code === current

        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            // aria-pressed rather than aria-current: these are toggle
            // buttons, not navigation.
            aria-pressed={isCurrent}
            // The language's own name is already the label, but a screen
            // reader in French reading "English" needs to switch voice —
            // lang on the button is what tells it to.
            lang={code}
            className={cn(
              'rounded-md py-1 text-xs font-semibold transition',
              compact ? 'px-2' : 'flex-1 px-2 py-1.5 text-sm',
              isCurrent
                ? 'bg-brand-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
            )}
          >
            {labelFor(code)}
          </button>
        )
      })}
    </div>
  )
}
