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
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-900">
      <div className="grid grid-cols-2 divide-x divide-stone-100 dark:divide-stone-800">
        <div className="px-6 py-5">
          <p className="mb-1.5 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
            Check-in
          </p>
          <p className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {formatDate(reservation.checkin_at)}
          </p>
          <p className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">14:00</p>
        </div>
        <div className="px-6 py-5">
          <p className="mb-1.5 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
            Check-out
          </p>
          <p className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {formatDate(reservation.checkout_at)}
          </p>
          <p className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">12:00</p>
        </div>
      </div>
      <div className="flex items-center gap-6 border-t border-stone-100 px-6 py-4 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
        <span>
          <strong className="text-stone-800 dark:text-stone-200">{nights}</strong>{' '}
          noite{nights !== 1 ? 's' : ''}
        </span>
        <span>
          <strong className="text-stone-800 dark:text-stone-200">
            {reservation.guests_count}
          </strong>{' '}
          hóspede{reservation.guests_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
