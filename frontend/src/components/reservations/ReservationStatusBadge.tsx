import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import type { ReservationStatusValue } from '@/types/reservation'

/**
 * One mapping of reservation status -> label + colour, shared by the
 * guest list and the owner list. Two copies would drift the day a
 * status is added backend-side. The label is a translation key
 * (reservationStatus.*), the colour is not language-dependent.
 */
const TONES: Record<ReservationStatusValue, BadgeTone> = {
  pending: 'amber',
  confirmed: 'green',
  rejected: 'red',
  cancelled: 'slate',
  completed: 'teal',
}

export default function ReservationStatusBadge({ status }: { status: ReservationStatusValue }) {
  const { t } = useTranslation()
  return <Badge tone={TONES[status]}>{t(`reservationStatus.${status}`)}</Badge>
}
