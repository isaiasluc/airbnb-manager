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
          <tr className="border-b border-stone-100 dark:border-stone-800">
            {COLUMNS.map((column) => (
              <th
                key={column}
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          key={fadeKey}
          className="page-fade-in divide-y divide-stone-50 dark:divide-stone-800"
        >
          {reservations.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRowClick(r.id)}
              className="group cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/70"
            >
              <td className="px-5 py-3.5">
                <span className="font-medium text-stone-800 group-hover:text-stone-900 dark:text-stone-200 dark:group-hover:text-white">
                  {guestName(r.guest_first_name, r.guest_last_name)}
                </span>
              </td>
              <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">
                {formatDate(r.checkin_at)}
              </td>
              <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">
                {formatDate(r.checkout_at)}
              </td>
              <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">
                {nightsCount(r.checkin_at, r.checkout_at)}n
              </td>
              <td className="px-5 py-3.5 font-medium text-stone-700 dark:text-stone-300">
                {formatCurrency(Number(r.host_payout))}
              </td>
              <td className="px-5 py-3.5 font-medium text-stone-700 dark:text-stone-300">
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
                  <span className="text-emerald-500">✓</span>
                ) : (
                  <span className="text-stone-300 dark:text-stone-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
