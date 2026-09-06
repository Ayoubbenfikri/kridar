/**
 * Joins class names, ignoring the falsy ones. Lets a component write
 * conditional classes without string concatenation everywhere:
 *
 *   cn('rounded-lg', isActive && 'bg-brand-600', className)
 *
 * No dependency needed - this is all `clsx` would do for our use.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
