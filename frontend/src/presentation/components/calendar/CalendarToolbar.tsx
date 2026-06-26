import type { DashboardView } from '@/application/reservations/useReservationFilters'
import { formatMonthLabel } from '@/presentation/shared/format'
import ViewToggle from './ViewToggle'

export default function CalendarToolbar({
  year,
  month,
  view,
  onPrevMonth,
  onNextMonth,
  onToday,
  onChangeView,
}: {
  year: number
  month: number
  view: DashboardView
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onChangeView: (view: DashboardView) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Mês anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
        >
          ‹
        </button>
        <h2 className="min-w-[10rem] text-center text-base font-semibold text-stone-900 dark:text-stone-100">
          {formatMonthLabel(year, month)}
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Próximo mês"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
        >
          ›
        </button>
        <button
          type="button"
          onClick={onToday}
          className="ml-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
        >
          Hoje
        </button>
      </div>

      <ViewToggle view={view} onChange={onChangeView} />
    </div>
  )
}
