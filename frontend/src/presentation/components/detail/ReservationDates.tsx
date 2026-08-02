import type { Reservation } from '@/domain/entities/reservation'
import { formatDate } from '@/presentation/shared/format'

export default function ReservationDates({
  reservation,
  nights,
}: {
  reservation: Reservation
  nights: number
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface transition-colors dark:border-line-dark dark:bg-surface-dark">
      <div className="grid grid-cols-2 divide-x divide-line dark:divide-line-dark">
        <div className="px-6 py-5">
          <p className="mb-1.5 text-xs uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">
            Check-in
          </p>
          <p className="font-display text-xl font-semibold text-ink dark:text-ink-dark">
            {formatDate(reservation.checkin_at)}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-muted-dark">14:00</p>
        </div>
        <div className="px-6 py-5">
          <p className="mb-1.5 text-xs uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">
            Check-out
          </p>
          <p className="font-display text-xl font-semibold text-ink dark:text-ink-dark">
            {formatDate(reservation.checkout_at)}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-muted-dark">11:00</p>
        </div>
      </div>
      <div className="flex items-center gap-6 border-t border-line px-6 py-4 text-sm text-ink-muted dark:border-line-dark dark:text-ink-muted-dark">
        <span>
          <strong className="text-ink dark:text-ink-dark">{nights}</strong>{' '}
          noite{nights !== 1 ? 's' : ''}
        </span>
        <span>
          <strong className="text-ink dark:text-ink-dark">
            {reservation.guests_count}
          </strong>{' '}
          hóspede{reservation.guests_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
