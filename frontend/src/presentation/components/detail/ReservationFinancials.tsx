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
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-900">
      <div className="grid grid-cols-1 divide-y divide-stone-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-stone-800">
        <div className="px-6 py-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
            Repasse do host
          </p>
          <p className="text-3xl font-semibold text-stone-900 dark:text-stone-100">
            {formatCurrency(Number(reservation.host_payout), reservation.currency)}
          </p>
          <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">
            {formatCurrency(
              Number(reservation.host_payout) / nights,
              reservation.currency,
            )}{' '}
            por noite
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
            Taxa de serviço
          </p>
          <p className="text-3xl font-semibold text-stone-900 dark:text-stone-100">
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
                    : 'bg-white text-stone-500 ring-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800'
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
