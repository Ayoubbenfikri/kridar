import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import type { RoommateListingType } from '@/types/roommateListing'

/**
 * Same shape and convention as PropertyFilters: every value is a string
 * because it comes from — and goes back to — the URL. This component
 * only edits a local draft and hands it back on "Apply".
 */
export interface RoommateFilterValues {
  type: string
  min_price: string
  max_price: string
  beds: string
  bedrooms: string
  furnished: string
  available_by: string
}

export const EMPTY_ROOMMATE_FILTERS: RoommateFilterValues = {
  type: '',
  min_price: '',
  max_price: '',
  beds: '',
  bedrooms: '',
  furnished: '',
  available_by: '',
}

const TYPE_VALUES: Array<RoommateListingType | ''> = ['', 'offer', 'request']

const COUNT_OPTIONS = ['', '1', '2', '3', '4']

const SELECT_CLASS =
  'h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-[15px] text-gray-900 transition ' +
  'hover:border-gray-300 focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/20 focus:outline-none'

const NUMBER_CLASS = SELECT_CLASS

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-900">{label}</span>
      {children}
    </label>
  )
}

export default function RoommateListingFilters({
  value,
  onApply,
  onReset,
}: {
  value: RoommateFilterValues
  onApply: (next: RoommateFilterValues) => void
  onReset: () => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<RoommateFilterValues>(value)

  function set<K extends keyof RoommateFilterValues>(key: K, next: RoommateFilterValues[K]) {
    setDraft((current) => ({ ...current, [key]: next }))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onApply(draft)
      }}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t('roommateFilters.type')}>
          <select
            value={draft.type}
            onChange={(event) => set('type', event.target.value)}
            className={SELECT_CLASS}
          >
            {TYPE_VALUES.map((option) => (
              <option key={option} value={option}>
                {option === '' ? t('roommateType.all') : t(`roommateType.${option}`)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('roommateFilters.minPrice', { unit: t('roommateFilters.perPerson') })}>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={draft.min_price}
            onChange={(event) => set('min_price', event.target.value)}
            className={NUMBER_CLASS}
          />
        </Field>

        <Field label={t('roommateFilters.maxPrice', { unit: t('roommateFilters.perPerson') })}>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t('roommateFilters.noLimit')}
            value={draft.max_price}
            onChange={(event) => set('max_price', event.target.value)}
            className={NUMBER_CLASS}
          />
        </Field>

        <Field label={t('roommateFilters.availableBy')}>
          <input
            type="date"
            value={draft.available_by}
            onChange={(event) => set('available_by', event.target.value)}
            className={NUMBER_CLASS}
          />
        </Field>

        {/* Minimums, server-side (>=), same as PropertyFilters' bedrooms/bathrooms. */}
        <Field label={t('roommateFilters.beds')}>
          <select
            value={draft.beds}
            onChange={(event) => set('beds', event.target.value)}
            className={SELECT_CLASS}
          >
            {COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count === '' ? t('roommateFilters.any') : `${count}+`}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('roommateFilters.bedrooms')}>
          <select
            value={draft.bedrooms}
            onChange={(event) => set('bedrooms', event.target.value)}
            className={SELECT_CLASS}
          >
            {COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count === '' ? t('roommateFilters.any') : `${count}+`}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('roommateFilters.furnished')}>
          <select
            value={draft.furnished}
            onChange={(event) => set('furnished', event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">{t('roommateFilters.furnishedAny')}</option>
            <option value="1">{t('roommateFilters.furnishedYes')}</option>
            <option value="0">{t('roommateFilters.furnishedNo')}</option>
          </select>
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
        <Button type="submit">{t('roommateFilters.apply')}</Button>
        <Button
          type="button"
          variant="ghost"
          icon={<RotateCcw className="size-4" />}
          onClick={() => {
            setDraft(EMPTY_ROOMMATE_FILTERS)
            onReset()
          }}
        >
          {t('roommateFilters.reset')}
        </Button>
      </div>
    </form>
  )
}
