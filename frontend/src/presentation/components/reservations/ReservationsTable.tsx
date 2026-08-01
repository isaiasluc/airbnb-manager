import type { Reservation } from '@/domain/entities/reservation'
import { guestName, nightsCount } from '@/domain/services/reservationStats'
import { formatCurrency, formatDate } from '@/presentation/shared/format'
import {
  hostServiceStatusColor,
  hostServiceStatusLabel,
  statusColor,
  statusLabel,
} from './statusPresentation'

const COLUMNS = [
  'Hóspede',
  'Check-in',
  'Check-out',
  'Noites',
  'Payout',
  'Taxa host',
  'Serviço',
  'Status',
  'Email',
]

export default function ReservationsTable({
  reservations,
  fadeKey,
  onRowClick,
}: {
  reservations: Reservation[]
  fadeKey: string
  onRowClick: (id: number) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-sm">
        <thead>
          <tr className="border-b border-line dark:border-line-dark">
            {COLUMNS.map((column) => (
              <th
                key={column}
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          key={fadeKey}
          className="page-fade-in divide-y divide-line/60 dark:divide-line-dark/60"
        >
          {reservations.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRowClick(r.id)}
              className="group cursor-pointer transition-colors hover:bg-accent-soft/50 dark:hover:bg-accent-soft-dark/40"
            >
              <td className="px-5 py-3.5">
                <span className="font-medium text-ink group-hover:text-accent dark:text-ink-dark dark:group-hover:text-accent-dark">
                  {guestName(r.guest_first_name, r.guest_last_name)}
                </span>
              </td>
              <td className="px-5 py-3.5 text-ink-muted dark:text-ink-muted-dark">
                {formatDate(r.checkin_at)}
              </td>
              <td className="px-5 py-3.5 text-ink-muted dark:text-ink-muted-dark">
                {formatDate(r.checkout_at)}
              </td>
              <td className="px-5 py-3.5 text-ink-muted dark:text-ink-muted-dark">
                {nightsCount(r.checkin_at, r.checkout_at)}n
              </td>
              <td className="px-5 py-3.5 font-medium tabular-nums text-ink dark:text-ink-dark">
                {formatCurrency(Number(r.host_payout))}
              </td>
              <td className="px-5 py-3.5 font-medium tabular-nums text-ink dark:text-ink-dark">
                {formatCurrency(Number(r.host_service_fee), r.currency)}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${hostServiceStatusColor[r.host_service_status]}`}
                >
                  {hostServiceStatusLabel[r.host_service_status]}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${statusColor[r.status]}`}
                >
                  {statusLabel[r.status]}
                </span>
              </td>
              <td className="px-5 py-3.5">
                {r.email_sent ? (
                  <span className="text-accent dark:text-accent-dark">✓</span>
                ) : (
                  <span className="text-ink-muted/50 dark:text-ink-muted-dark/50">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
