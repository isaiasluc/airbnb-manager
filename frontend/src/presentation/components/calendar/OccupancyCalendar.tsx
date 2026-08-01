import type { CalendarWeek } from '@/domain/entities/calendar'
import CalendarDayCell from './CalendarDayCell'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function OccupancyCalendar({
  weeks,
  loading,
  onSelectReservation,
}: {
  weeks: CalendarWeek[]
  loading: boolean
  onSelectReservation: (reservationId: number) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface transition-colors dark:border-line-dark dark:bg-surface-dark">
      <div className="grid grid-cols-7 border-b border-line dark:border-line-dark">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className={`relative grid grid-cols-7 ${loading ? 'opacity-50' : ''}`}>
        {weeks.flat().map((day) => (
          <CalendarDayCell
            key={day.date}
            day={day}
            onSelect={onSelectReservation}
          />
        ))}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted dark:text-ink-muted-dark">
            Carregando...
          </div>
        )}
      </div>
    </div>
  )
}
