import {
  RESERVATION_FILTERS,
  type ReservationFilter,
} from '@/domain/services/reservationStats'
import { statusLabel } from './statusPresentation'

const LABEL: Record<ReservationFilter, string> = {
  all: 'Todas',
  confirmed: statusLabel.confirmed,
  in_progress: statusLabel.in_progress,
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
      <div className="relative sm:hidden mb-5">
        <select
          value={filter}
          onChange={(e) => onChange(e.target.value as ReservationFilter)}
          className="appearance-none h-9 rounded-lg border border-stone-200 bg-white pl-3 pr-8 text-sm font-medium text-stone-700 outline-none transition-colors focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:focus:border-stone-500"
        >
          {RESERVATION_FILTERS.map((f) => (
            <option key={f} value={f}>
              {LABEL[f]}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

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
