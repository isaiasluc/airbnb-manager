import {
  RESERVATION_FILTERS,
  type ReservationFilter,
} from '@/domain/services/reservationStats'
import { statusLabel } from './statusPresentation'

const LABEL: Record<ReservationFilter, string> = {
  all: 'Todas',
  confirmed: statusLabel.confirmed,
  completed: statusLabel.completed,
  cancelled: statusLabel.cancelled,
}

const ACTIVE_CLASS =
  'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950'
const INACTIVE_CLASS =
  'bg-white text-stone-500 border border-stone-200 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500'

export default function ReservationStatusTabs({
  filter,
  onChange,
}: {
  filter: ReservationFilter
  onChange: (filter: ReservationFilter) => void
}) {
  return (
    <>
      {/* Mobile: dropdown */}
      <select
        value={filter}
        onChange={(e) => onChange(e.target.value as ReservationFilter)}
        className="sm:hidden mb-5 h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 outline-none transition-colors focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:focus:border-stone-500"
      >
        {RESERVATION_FILTERS.map((f) => (
          <option key={f} value={f}>
            {LABEL[f]}
          </option>
        ))}
      </select>

      {/* Desktop: botões */}
      <div className="hidden sm:flex gap-2 mb-5">
        {RESERVATION_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === f ? ACTIVE_CLASS : INACTIVE_CLASS
            }`}
          >
            {LABEL[f]}
          </button>
        ))}
      </div>
    </>
  )
}
