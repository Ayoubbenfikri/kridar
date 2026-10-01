import { useId } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { AlertCircle, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  error?: string
  hint?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  disabled?: boolean
  name?: string
  className?: string
}

/**
 * Fully custom-styled dropdown, built on Headless UI's Listbox.
 *
 * A native <select>'s open option list is drawn by the browser/OS, not by
 * our CSS — rounded corners, brand colors, our font never reach it, on
 * any browser. Headless UI renders every pixel of both the closed button
 * and the open panel ourselves (so it looks like the rest of the app)
 * while still handling keyboard navigation, focus and screen readers,
 * which we'd otherwise have to rebuild by hand.
 *
 * API note: this replaces the old <option> children with an `options`
 * array ({ value, label }) and a controlled `value`/`onChange` pair —
 * Headless UI's Listbox doesn't read native <option> tags. Every call
 * site had to switch to this shape (see PropertyForm, PropertyFilters,
 * RoommateListingForm, RoommateListingFilters).
 *
 * Same anatomy as <Input> (label, error, hint, id-linked label) so a form
 * mixing text fields and dropdowns still lines up.
 */
export default function Select({
  label,
  error,
  hint,
  value,
  onChange,
  options,
  disabled,
  name,
  className,
}: SelectProps) {
  const id = useId()
  const selected = options.find((option) => option.value === value) ?? options[0]

  return (
    // as="div": Headless UI's Listbox renders as a Fragment by default (no
    // wrapping DOM node) — fine on its own, but inside a CSS grid
    // (PropertyFilters, RoommateListingFilters: `grid grid-cols-4 ...`)
    // the <label> and the button/panel below then land as two SEPARATE
    // grid items instead of one cell, shifting every field after it.
    // Forcing a real <div> here is what makes this one grid cell again,
    // same as the old native-<select> version's wrapping <div>.
    <Listbox as="div" value={value} onChange={onChange} disabled={disabled} name={name}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-900">
          {label}
        </label>
      )}

      <div className="relative">
        <ListboxButton
          id={id}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 text-start text-[15px] text-gray-900 transition',
            'hover:border-gray-300 focus:outline-none data-[focus]:ring-[3px]',
            'data-[disabled]:cursor-not-allowed data-[disabled]:bg-gray-50 data-[disabled]:text-gray-400',
            error
              ? 'border-red-300 data-[focus]:border-red-500 data-[focus]:ring-red-500/20'
              : 'border-gray-200 data-[focus]:border-brand-500 data-[focus]:ring-brand-500/20',
            className,
          )}
        >
          <span className="truncate">{selected?.label}</span>
          <ChevronDown className="size-4 shrink-0 text-gray-400" aria-hidden />
        </ListboxButton>

        {/* anchor="bottom start" + the --button-width var (set by Headless
            UI on the anchored panel) keeps the panel glued under the
            button and exactly as wide as it, with no manual positioning
            math. `transition` wires up the data-[closed]/[enter]/[leave]
            attributes below for a plain fade+scale. */}
        <ListboxOptions
          anchor="bottom start"
          transition
          className={cn(
            'z-50 mt-1.5 max-h-64 w-[var(--button-width)] overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg',
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
      </div>

      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </Listbox>
  )
}
