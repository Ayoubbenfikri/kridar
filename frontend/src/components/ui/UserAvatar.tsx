import { User } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * A handful of tints an avatar can be assigned when there is no photo —
 * purely decorative, no color means anything. Picked from `seed` (a
 * user's own id) so the same person always lands on the same color
 * instead of flickering between colors across renders.
 */
const AVATAR_PALETTE = [
  'bg-brand-100 text-brand-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
]

const SIZE_CLASSES = {
  xs: 'size-7 text-[10px]',
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-lg',
  xl: 'size-24 text-2xl',
} as const

export type UserAvatarSize = keyof typeof SIZE_CLASSES

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/**
 * Shows the real photo when one was uploaded (avatar_url), otherwise
 * falls back to a colored circle with initials — same look used
 * everywhere a user shows up (Navbar, Messages, roommate/property
 * listings) so switching from initials to a real photo later needs no
 * other change anywhere.
 */
export default function UserAvatar({
  name,
  avatarUrl,
  seed,
  size = 'md',
  className,
}: {
  name: string | null | undefined
  avatarUrl?: string | null
  /** A stable number — a user's own id — that picks the fallback color. */
  seed: number
  size?: UserAvatarSize
  className?: string
}) {
  const label = name ?? 'Utilisateur'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        className={cn('shrink-0 rounded-full object-cover', SIZE_CLASSES[size], className)}
      />
    )
  }

  // % can return a negative number for a negative seed — never expected
  // in practice (ids are positive), but the double-modulo keeps this
  // from ever indexing the palette array out of bounds.
  const paletteIndex = ((seed % AVATAR_PALETTE.length) + AVATAR_PALETTE.length) % AVATAR_PALETTE.length
  const text = initials(label)

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        SIZE_CLASSES[size],
        AVATAR_PALETTE[paletteIndex],
        className,
      )}
    >
      {text || <User className="size-1/2" aria-hidden />}
    </div>
  )
}
