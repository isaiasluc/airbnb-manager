import type { SyncStatus } from '@/domain/entities/sync'
import ThemeToggle from '@/presentation/shared/ThemeToggle'
import {
  getCurrentMonthRange,
  getNext30DaysRange,
} from '@/presentation/shared/dateRanges'
import SyncMessageBar from '@/presentation/components/sync/SyncMessageBar'
import SyncStatusBar from '@/presentation/components/sync/SyncStatusBar'

interface DashboardHeaderProps {
  onHomeClick: () => void
  filtersOpen: boolean
  onToggleFilters: () => void
  activeFiltersCount: number
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onApplyDateRange: (range: { from: string; to: string }) => void
  onClearDates: () => void
  onExportCsv: () => void
  exporting: boolean
  exportDisabled: boolean
  onSignOut: () => void
  canSyncGmail: boolean
  syncStatus: SyncStatus | null
  syncMsg: string | null
  onOpenSyncModal: () => void
}

const FILTER_BUTTON_CLASS =
  'h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500'

const DATE_INPUT_CLASS =
  'h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:focus:border-stone-500'

export default function DashboardHeader({
  onHomeClick,
  filtersOpen,
  onToggleFilters,
  activeFiltersCount,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyDateRange,
  onClearDates,
  onExportCsv,
  exporting,
  exportDisabled,
  onSignOut,
  canSyncGmail,
  syncStatus,
  syncMsg,
  onOpenSyncModal,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-950">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <button type="button" onClick={onHomeClick} className="text-left group">
          <h1 className="text-xl font-semibold text-stone-900 tracking-tight transition-colors group-hover:text-stone-600 dark:text-stone-100 dark:group-hover:text-stone-300">
            Hospedagens
          </h1>
          <p className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">
            Apê dos sonhos em Ponta Negra
          </p>
        </button>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-2 sm:hidden">
            <button
              type="button"
              onClick={onToggleFilters}
              aria-expanded={filtersOpen}
              className={FILTER_BUTTON_CLASS}
            >
              Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </button>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={onSignOut}
                className={FILTER_BUTTON_CLASS}
              >
                Sair
              </button>
            </div>
          </div>
          <div className={`${filtersOpen ? 'flex' : 'hidden'} flex-col gap-3 sm:flex`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                  Início
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => onDateFromChange(event.target.value)}
                    className={DATE_INPUT_CLASS}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                  Fim
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => onDateToChange(event.target.value)}
                    className={DATE_INPUT_CLASS}
                  />
                </label>
              </div>
              <div className="hidden items-center gap-2 sm:flex sm:justify-end">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={onSignOut}
                  className={FILTER_BUTTON_CLASS}
                >
                  Sair
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => onApplyDateRange(getCurrentMonthRange())}
                className={FILTER_BUTTON_CLASS}
              >
                Este mês
              </button>
              <button
                type="button"
                onClick={() => onApplyDateRange(getNext30DaysRange())}
                className={FILTER_BUTTON_CLASS}
              >
                Próximos 30 dias
              </button>
              <button type="button" onClick={onClearDates} className={FILTER_BUTTON_CLASS}>
                Todos
              </button>
              <button
                type="button"
                onClick={onExportCsv}
                disabled={exportDisabled}
                className="h-9 rounded-lg bg-stone-900 px-3 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-300"
              >
                {exporting ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {canSyncGmail && <SyncStatusBar syncStatus={syncStatus} />}
      {syncMsg && (
        <SyncMessageBar syncMsg={syncMsg} onOpenSyncModal={onOpenSyncModal} />
      )}
    </header>
  )
}
