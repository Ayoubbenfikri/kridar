import { useTranslation } from 'react-i18next'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronsUpDown, Globe } from 'lucide-react'
import { useLocale } from '@/features/locale/useLocale'
import { LOCALES } from '@/i18n'
import type { LocaleCode } from '@/i18n'
import { cn } from '@/lib/cn'

/**
 * The language picker: one compact button (globe + current language)
 * that opens a small list.
 *
 * Oct 2026: it used to be a three-button segmented pill. Asked to look
 * more modern and take less room; a Headless UI Listbox (already used by
 * the search bar) handles keyboard, Escape and outside clicks for us, so
 * the old reason for avoiding a dropdown no longer holds.
 *
 * `openUp`: the desktop sidebar puts this at the very bottom of the
 * screen, so its list must open upward there.
 */
export default function LanguageSwitcher({ openUp = false }: { openUp?: boolean }) {
  const { t } = useTranslation()
  const { current, setLocale } = useLocale()

  return (
    <Listbox value={current} onChange={(code: LocaleCode) => setLocale(code)}>
      <ListboxButton
        aria-label={t('language.label')}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition',
          'hover:border-gray-300 hover:shadow-sm focus:outline-none data-[focus]:ring-[3px] data-[focus]:ring-brand-500/30',
        )}
      >
        <Globe className="size-4.5 shrink-0 text-brand-600" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-start" lang={current}>
          {t(`language.${current}`)}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-gray-400" aria-hidden />
      </ListboxButton>

      <ListboxOptions
        anchor={openUp ? 'top start' : 'bottom start'}
        transition
        className={cn(
          'z-50 w-[var(--button-width)] rounded-xl border border-gray-200 bg-white p-1 shadow-lg',
          openUp ? '[--anchor-gap:0.5rem]' : '[--anchor-gap:0.375rem]',
          'transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 focus:outline-none',
        )}
      >
        {LOCALES.map((code) => (
          <ListboxOption
            key={code}
            value={code}
            // A screen reader in French reading "English" needs to switch
            // voice - lang on the option is what tells it to.
            lang={code}
            className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 data-[focus]:bg-gray-50 data-[selected]:font-semibold data-[selected]:text-brand-700"
          >
            <span className="min-w-0 flex-1 truncate">{t(`language.${code}`)}</span>
            <Check className="invisible size-4 shrink-0 text-brand-600 group-data-[selected]:visible" aria-hidden />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}
