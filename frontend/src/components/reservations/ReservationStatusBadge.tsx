import { Badge } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import type { ReservationStatusValue } from '@/types/reservation'

/**
 * One mapping of reservation status -> label + colour, shared by the
 * guest list and the owner list. Two copies would drift the day a
 * status is added backend-side.
 */
const STATUS: Record<ReservationStatusValue, { label: string; tone: BadgeTone }> = {
  pending: { label: 'En attente', tone: 'amber' },
  confirmed: { label: 'Confirmée', tone: 'green' },
  rejected: { label: 'Refusée', tone: 'red' },
  cancelled: { label: 'Annulée', tone: 'slate' },
  completed: { label: 'Terminée', tone: 'teal' },
}

export default function ReservationStatusBadge({ status }: { status: ReservationStatusValue }) {
  const { label, tone } = STATUS[status]
  return <Badge tone={tone}>{label}</Badge>
}
