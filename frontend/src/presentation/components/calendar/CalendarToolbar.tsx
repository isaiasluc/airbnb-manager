import type { DashboardView } from '@/application/reservations/useReservationFilters'
import { formatMonthLabel } from '@/presentation/shared/format'
import { buttonSecondary, iconButton } from '@/presentation/shared/buttonStyles'
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
          className={iconButton}
        >
          ‹
        </button>
        <h2 className="font-display min-w-[10rem] text-center text-base font-semibold text-ink dark:text-ink-dark">
          {formatMonthLabel(year, month)}
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Próximo mês"
          className={iconButton}
        >
          ›
        </button>
        <button type="button" onClick={onToday} className={`ml-1 ${buttonSecondary}`}>
          Hoje
        </button>
      </div>

      <ViewToggle view={view} onChange={onChangeView} />
    </div>
  )
}
