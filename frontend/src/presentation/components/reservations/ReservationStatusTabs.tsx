import {
  RESERVATION_FILTERS,
  type ReservationFilter,
} from '@/domain/services/reservationStats'
import { statusLabel } from './statusPresentation'

export default function ReservationStatusTabs({
  filter,
  onChange,
}: {
  filter: ReservationFilter
  onChange: (filter: ReservationFilter) => void
}) {
  return (
    <div className="flex gap-2 mb-5">
      {RESERVATION_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
            filter === f
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950'
              : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500'
          }`}
        >
          {f === 'all' ? 'Todas' : statusLabel[f]}
        </button>
      ))}
    </div>
  )
}
