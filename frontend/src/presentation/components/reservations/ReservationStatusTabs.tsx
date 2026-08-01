import {
  RESERVATION_FILTERS,
  type ReservationFilter,
} from '@/domain/services/reservationStats'
import SegmentedControl from '@/presentation/shared/SegmentedControl'
import { statusLabel } from './statusPresentation'

const LABEL: Record<ReservationFilter, string> = {
  all: 'Todas',
  confirmed: statusLabel.confirmed,
  in_progress: statusLabel.in_progress,
  completed: statusLabel.completed,
  cancelled: statusLabel.cancelled,
}

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
          className="appearance-none h-9 rounded-lg border border-line bg-surface pl-3 pr-8 text-sm font-medium text-ink outline-none transition-colors focus:border-accent dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark dark:focus:border-accent-dark"
        >
          {RESERVATION_FILTERS.map((f) => (
            <option key={f} value={f}>
              {LABEL[f]}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted dark:text-ink-muted-dark"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Desktop: segmented control */}
      <div className="hidden sm:block mb-5">
        <SegmentedControl
          options={RESERVATION_FILTERS.map((f) => ({ value: f, label: LABEL[f] }))}
          value={filter}
          onChange={onChange}
        />
      </div>
    </>
  )
}
