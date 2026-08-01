import type { CalendarDay } from '@/domain/entities/calendar'
import { guestName } from '@/domain/services/reservationStats'

export default function CalendarDayCell({
  day,
  onSelect,
}: {
  day: CalendarDay
  onSelect: (reservationId: number) => void
}) {
  const occupyingStays = day.stays.filter(
    (stay) => stay.reservation.status !== 'cancelled',
  )
  const hasActiveStay = occupyingStays.some((stay) => stay.isActive)
  const hasFutureStay = occupyingStays.some(
    (stay) => !stay.isActive && !stay.isPast,
  )
  const hasPastStay = occupyingStays.some((stay) => stay.isPast)

  return (
    <div
      className={`flex min-h-[5.5rem] flex-col gap-1 border-b border-r border-line p-1.5 dark:border-line-dark ${
        day.isCurrentMonth
          ? hasActiveStay
            ? 'bg-red-50/70 dark:bg-red-950/20'
            : hasFutureStay
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
              : hasPastStay
                ? 'bg-ink-muted/10 dark:bg-ink-muted-dark/10'
                : 'bg-surface dark:bg-surface-dark'
          : 'bg-paper dark:bg-paper-dark/60'
      }`}
    >
      <span
        className={`self-end text-xs font-medium ${
          day.isToday
            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white dark:bg-accent-dark dark:text-ink'
            : day.isCurrentMonth
              ? 'text-ink-muted dark:text-ink-muted-dark'
              : 'text-ink-muted/50 dark:text-ink-muted-dark/50'
        }`}
      >
        {day.day}
      </span>

      <div className="flex flex-col gap-1">
        {day.stays.map((stay) => {
          const name = guestName(
            stay.reservation.guest_first_name,
            stay.reservation.guest_last_name,
          )
          const cancelled = stay.reservation.status === 'cancelled'
          const active = stay.isActive && !cancelled

          return (
            <button
              key={stay.reservation.id}
              type="button"
              onClick={() => onSelect(stay.reservation.id)}
              title={`${name}${cancelled ? ' (cancelada)' : ''}`}
              className={`truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors ${
                cancelled
                  ? 'bg-ink-muted/15 text-ink-muted line-through hover:bg-ink-muted/25 dark:bg-ink-muted-dark/15 dark:text-ink-muted-dark'
                  : active
                    ? 'bg-red-500/90 text-white hover:bg-red-600'
                    : stay.isPast
                      ? 'bg-ink-muted text-white hover:bg-ink-muted/80 dark:bg-ink-muted-dark dark:text-ink dark:hover:bg-ink-muted-dark/80'
                      : 'bg-emerald-500/90 text-white hover:bg-emerald-600'
              }`}
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
