import type { DashboardView } from '@/application/reservations/useReservationFilters'

export default function ViewToggle({
  view,
  onChange,
}: {
  view: DashboardView
  onChange: (view: DashboardView) => void
}) {
  return (
    <div className="flex gap-2 mb-5">
      {(['list', 'calendar'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            view === option
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950'
              : 'border border-stone-200 bg-white text-stone-500 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500'
          }`}
        >
          {option === 'list' ? 'Lista' : 'Calendário'}
        </button>
      ))}
    </div>
  )
}
