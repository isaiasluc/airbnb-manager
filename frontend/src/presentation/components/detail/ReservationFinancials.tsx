import type { Reservation } from '@/domain/entities/reservation'
import { formatCurrency } from '@/presentation/shared/format'
import {
  hostServiceStatusColor,
  hostServiceStatusLabel,
} from '@/presentation/components/reservations/statusPresentation'

const HOST_SERVICE_STATUSES = ['pending', 'paid', 'cancelled'] as const

export default function ReservationFinancials({
  reservation,
  nights,
  saving,
  onChangeHostServiceStatus,
}: {
  reservation: Reservation
  nights: number
  saving: boolean
  onChangeHostServiceStatus: (
    status: Reservation['host_service_status'],
  ) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-t-2 border-line border-t-accent bg-surface transition-colors dark:border-line-dark dark:border-t-accent-dark dark:bg-surface-dark">
      <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-line-dark">
        <div className="px-6 py-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">
            Repasse do host
          </p>
          <p className="font-display text-3xl font-semibold tabular-nums text-accent dark:text-accent-dark">
            {formatCurrency(Number(reservation.host_payout), reservation.currency)}
          </p>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
            {formatCurrency(
              Number(reservation.host_payout) / nights,
              reservation.currency,
            )}{' '}
            por noite
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">
            Taxa de serviço
          </p>
          <p className="font-display text-3xl font-semibold tabular-nums text-accent dark:text-accent-dark">
            {formatCurrency(
              Number(reservation.host_service_fee),
              reservation.currency,
            )}
          </p>
          <div className="mt-3 flex gap-2">
            {HOST_SERVICE_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => onChangeHostServiceStatus(status)}
                disabled={saving || reservation.host_service_status === status}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ring-1 transition-colors disabled:opacity-50 ${
                  reservation.host_service_status === status
                    ? hostServiceStatusColor[status]
                    : 'bg-surface text-ink-muted ring-line hover:bg-paper dark:bg-surface-dark dark:text-ink-muted-dark dark:ring-line-dark dark:hover:bg-paper-dark'
                }`}
              >
                {hostServiceStatusLabel[status]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
