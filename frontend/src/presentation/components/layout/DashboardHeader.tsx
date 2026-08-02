import type { SyncStatus } from '@/domain/entities/sync'
import {
  getCurrentMonthRange,
  getNext30DaysRange,
} from '@/presentation/shared/dateRanges'
import { iconButton } from '@/presentation/shared/buttonStyles'
import DateRangePicker, { type DateRangePreset } from '@/presentation/shared/DateRangePicker'
import Tooltip from '@/presentation/shared/Tooltip'
import SyncMessageBar from '@/presentation/components/sync/SyncMessageBar'
import SyncStatusBar from '@/presentation/components/sync/SyncStatusBar'
import SyncButton from '@/presentation/components/sync/SyncButton'

const DATE_PRESETS: DateRangePreset[] = [
  { key: 'month', label: 'Este mês', ...getCurrentMonthRange() },
  { key: 'next30', label: 'Próximos 30 dias', ...getNext30DaysRange() },
  { key: 'all', label: 'Todos', from: '', to: '' },
]

interface DashboardHeaderProps {
  dateFrom: string
  dateTo: string
  onApplyDateRange: (range: { from: string; to: string }) => void
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
  dateFrom,
  dateTo,
  onApplyDateRange,
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
    <header className="sticky top-14 z-10 border-b border-line bg-surface transition-colors md:top-0 dark:border-line-dark dark:bg-surface-dark">
      <div className="hidden max-w-6xl mx-auto px-6 pt-5 pb-3 md:block">
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Hospedagens
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-2">
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          presets={DATE_PRESETS}
          onApply={onApplyDateRange}
        />

        <div className="flex flex-wrap items-center gap-2">
          {canSyncGmail && (
            <SyncButton
              googleAuthenticated={googleAuthenticated}
              syncing={syncing}
              authenticatingGoogle={authenticatingGoogle}
              onSync={onSync}
              onGoogleAuth={onGoogleAuth}
            />
          )}
          <Tooltip label={exporting ? 'Exportando...' : 'Exportar CSV'}>
            <button
              type="button"
              onClick={onExportCsv}
              disabled={exportDisabled}
              aria-label="Exportar CSV"
              className={iconButton}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      {canSyncGmail && <SyncStatusBar syncStatus={syncStatus} />}
      {syncMsg && (
        <SyncMessageBar syncMsg={syncMsg} onOpenSyncModal={onOpenSyncModal} />
      )}
    </header>
  )
}
