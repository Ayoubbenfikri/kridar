import type { ReactNode } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import type { SelectOption } from '@/components/ui/Select'
import { cn } from '@/lib/cn'

interface SearchSelectProps {
  /** Small uppercase caption above the value (same look as the other hero fields). */
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Where the field sits in the search bar's grid / flex row. */
  className?: string
}

/**
 * A dropdown for the hero search bar.
 *
 * Same Headless UI Listbox and same open panel as <Select> (the one used in
 * the "add a property" form: rounded panel, check mark on the chosen row,
 * brand colour on the hovered row), but the closed state is a BARE field -
 * no box, no border - because the hero fields are cells of one bar, not
 * stand-alone form inputs. That is why this is not <Select> itself: its
 * closed button is a boxed input.
 */
export default function SearchSelect({ label, icon, value, onChange, options, className }: SearchSelectProps) {
  const selected = options.find((option) => option.value === value) ?? options[0]

  return (
    // as="div": one real DOM node, so it is ONE cell of the bar's grid.
    <Listbox as="div" value={value} onChange={onChange} className={cn('relative min-w-0', className)}>
      <ListboxButton
        className={cn(
          'flex h-full w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition hover:bg-gray-50 sm:px-4 sm:py-2.5',
          'focus:outline-none data-[focus]:ring-[3px] data-[focus]:ring-brand-500/30',
        )}
      >
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{label}</span>
          <span className="block truncate text-[15px] text-gray-900">{selected?.label}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-gray-400" aria-hidden />
      </ListboxButton>

      {/* At least as wide as the field, and never narrower than 15rem: some
          fields are small and the labels ("3 K - 6 K MAD") need room. */}
      <ListboxOptions
        anchor="bottom start"
        transition
        className={cn(
          'z-50 mt-2 max-h-72 w-[max(var(--button-width),15rem)] overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg',
          'transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0',
          'focus:outline-none',
        )}
      >
        {options.map((option) => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[15px] text-gray-700 select-none data-[focus]:bg-brand-50 data-[focus]:text-brand-700"
          >
            <Check
              className="size-4 shrink-0 text-brand-600 opacity-0 group-data-[selected]:opacity-100"
              aria-hidden
            />
            <span className="truncate group-data-[selected]:font-semibold group-data-[selected]:text-gray-900">
              {option.label}
            </span>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}
