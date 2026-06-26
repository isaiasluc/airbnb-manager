import type { CalendarDay } from '@/domain/entities/calendar'
import { guestName } from '@/domain/services/reservationStats'

export default function CalendarDayCell({
  day,
  onSelect,
}: {
  day: CalendarDay
  onSelect: (reservationId: number) => void
}) {
  return (
    <div
      className={`flex min-h-[5.5rem] flex-col gap-1 border-b border-r border-stone-200 p-1.5 dark:border-stone-800 ${
        day.isCurrentMonth
          ? day.isOccupied
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
            : 'bg-white dark:bg-stone-900'
          : 'bg-stone-50 dark:bg-stone-950/40'
      }`}
    >
      <span
        className={`self-end text-xs font-medium ${
          day.isToday
            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950'
            : day.isCurrentMonth
              ? 'text-stone-500 dark:text-stone-400'
              : 'text-stone-300 dark:text-stone-600'
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

          return (
            <button
              key={stay.reservation.id}
              type="button"
              onClick={() => onSelect(stay.reservation.id)}
              title={`${name}${cancelled ? ' (cancelada)' : ''}`}
              className={`truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors ${
                cancelled
                  ? 'bg-stone-100 text-stone-400 line-through hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-500'
                  : 'bg-emerald-500/90 text-white hover:bg-emerald-600'
              }`}
            >
              {stay.isCheckIn || !day.isOccupied ? name : ' '}
            </button>
          )
        })}
      </div>
    </div>
  )
}
