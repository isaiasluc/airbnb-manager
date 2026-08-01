import type { SyncStatus } from '@/domain/entities/sync'
import { formatLastSync, formatSyncSource } from '@/presentation/shared/format'

export default function SyncStatusBar({
  syncStatus,
}: {
  syncStatus: SyncStatus | null
}) {
  return (
    <div className="border-t border-line bg-paper/60 dark:border-line-dark dark:bg-paper-dark/40">
      <div className="max-w-6xl mx-auto px-6 py-2">
        <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
          Último sync
          {syncStatus?.lastSyncSource
            ? ` ${formatSyncSource(syncStatus.lastSyncSource)}`
            : ''}
          : {formatLastSync(syncStatus?.lastSyncAt ?? null)}
        </p>
      </div>
    </div>
  )
}
