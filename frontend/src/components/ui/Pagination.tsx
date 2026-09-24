import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

/**
 * The prev / "page x of y" / next block. It was copy-pasted in five
 * pages before this; keeping it here means a change to pagination is
 * one edit, not five.
 *
 * Renders nothing when there is only one page - a pager that can never
 * be used is noise.
 *
 * RTL (Phase 27): the chevrons get rtl:rotate-180 so "previous" points
 * the way reading goes. The buttons themselves need nothing — the row is
 * flex, so it reverses on its own.
 */
export default function Pagination({
  currentPage,
  lastPage,
  onChange,
}: {
  currentPage: number
  lastPage: number
  onChange: (page: number) => void
}) {
  const { t } = useTranslation()

  if (lastPage <= 1) return null

  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t('properties.pagination')}>
      <Button
        variant="secondary"
        size="sm"
        icon={<ChevronLeft className="size-4 rtl:rotate-180" />}
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
      >
        {t('properties.previous')}
      </Button>
      <span className="text-sm text-gray-500">
        {t('properties.pageOf', { current: currentPage, last: lastPage })}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= lastPage}
        onClick={() => onChange(currentPage + 1)}
      >
        {t('properties.next')}
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
      </Button>
    </nav>
  )
}
