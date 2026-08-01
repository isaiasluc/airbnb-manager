import type { SyncStatus } from '@/domain/entities/sync'
import {
  getCurrentMonthRange,
  getNext30DaysRange,
} from '@/presentation/shared/dateRanges'
import {
  buttonSecondary,
  buttonSecondaryActive,
  inputClass,
  labelClass,
} from '@/presentation/shared/buttonStyles'
import SyncMessageBar from '@/presentation/components/sync/SyncMessageBar'
import SyncStatusBar from '@/presentation/components/sync/SyncStatusBar'
import SyncButton from '@/presentation/components/sync/SyncButton'

type QuickRange = 'month' | 'next30' | 'all'

interface DashboardHeaderProps {
  activeQuickRange: QuickRange | null
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onApplyDateRange: (range: { from: string; to: string }) => void
  onClearDates: () => void
  onExportCsv: () => void
  exporting: boolean
  exportDisabled: boolean
  canSyncGmail: boolean
  syncStatus: SyncStatus | null
  syncMsg: string | null
  onOpenSyncModal: () => void
  googleAuthenticated: boolean
  syncing: boolean
  authenticatingGoogle: boolean
  onSync: () => void
  onGoogleAuth: () => void
}

export default function DashboardHeader({
  activeQuickRange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyDateRange,
  onClearDates,
  onExportCsv,
  exporting,
  exportDisabled,
  canSyncGmail,
  syncStatus,
  syncMsg,
  onOpenSyncModal,
  googleAuthenticated,
  syncing,
  authenticatingGoogle,
  onSync,
  onGoogleAuth,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface transition-colors dark:border-line-dark dark:bg-surface-dark">
      <div className="max-w-6xl mx-auto px-6 pt-5 pb-3">
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Hospedagens
        </h1>
      </div>

      <div className="border-t border-line bg-paper/60 dark:border-line-dark dark:bg-paper-dark/40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-end gap-x-3 gap-y-2">
          <label className={`flex flex-col gap-1 ${labelClass}`}>
            Início
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className={`flex flex-col gap-1 ${labelClass}`}>
            Fim
            <input
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
              className={inputClass}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onApplyDateRange(getCurrentMonthRange())}
              className={activeQuickRange === 'month' ? buttonSecondaryActive : buttonSecondary}
            >
              Este mês
            </button>
            <button
              type="button"
              onClick={() => onApplyDateRange(getNext30DaysRange())}
              className={activeQuickRange === 'next30' ? buttonSecondaryActive : buttonSecondary}
            >
              Próximos 30 dias
            </button>
            <button
              type="button"
              onClick={onClearDates}
              className={activeQuickRange === 'all' ? buttonSecondaryActive : buttonSecondary}
            >
              Todos
            </button>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {canSyncGmail && (
              <SyncButton
                googleAuthenticated={googleAuthenticated}
                syncing={syncing}
                authenticatingGoogle={authenticatingGoogle}
                onSync={onSync}
                onGoogleAuth={onGoogleAuth}
              />
            )}
            <button
              type="button"
              onClick={onExportCsv}
              disabled={exportDisabled}
              className={buttonSecondary}
            >
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
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
