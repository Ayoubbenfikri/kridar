import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

/**
 * The prev / "page x of y" / next block. It was copy-pasted in five
 * pages before this; keeping it here means a change to pagination is
 * one edit, not five.
 *
 * Renders nothing when there is only one page - a pager that can never
 * be used is noise.
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
  if (lastPage <= 1) return null

  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        icon={<ChevronLeft className="size-4" />}
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
      >
        Précédent
      </Button>
      <span className="text-sm text-gray-500">
        Page {currentPage} / {lastPage}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= lastPage}
        onClick={() => onChange(currentPage + 1)}
      >
        Suivant
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </nav>
  )
}
