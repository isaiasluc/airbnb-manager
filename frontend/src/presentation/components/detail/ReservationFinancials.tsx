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
  onEditPayout,
  onDismissPayoutReview,
}: {
  reservation: Reservation
  nights: number
  saving: boolean
  onChangeHostServiceStatus: (
    status: Reservation['host_service_status'],
  ) => void
  onEditPayout: () => void
  onDismissPayoutReview: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-t-2 border-line border-t-accent bg-surface transition-colors dark:border-line-dark dark:border-t-accent-dark dark:bg-surface-dark">
      {reservation.payout_needs_review && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
        >
          <p className="flex-1 basis-64">
            <strong className="font-semibold">Conferir payout no Airbnb.</strong> A reserva foi
            alterada no Airbnb e o e-mail não traz o valor novo do repasse.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onEditPayout}
              disabled={saving}
              className="font-medium underline-offset-2 hover:underline disabled:opacity-50"
            >
              Ajustar valor
            </button>
            <button
              type="button"
              onClick={onDismissPayoutReview}
              disabled={saving}
              className="font-medium underline-offset-2 hover:underline disabled:opacity-50"
            >
              Payout está certo
            </button>
          </div>
        </div>
      )}
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
