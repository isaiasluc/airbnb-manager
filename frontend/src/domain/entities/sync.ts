export interface SyncResult {
  imported: number
  skipped: number
  cancelled: number
  importedItems: SyncItem[]
  skippedItems: SyncItem[]
  cancelledItems: SyncItem[]
  /** Ausente em resultados de sync anteriores ao passo de alterações. */
  updated?: number
  updatedItems?: SyncItem[]
  errors: { emailId: string; reason: string }[]
  syncStatus?: SyncStatus
}

export interface SyncItem {
  emailId: string
  subject: string
  guestName?: string
  confirmationCode?: string
  reason?: string
  changedFields?: string[]
}

export interface SyncStatus {
  isRunning: boolean
  lastSyncAt: string | null
  lastSyncSource: 'manual' | 'cron' | null
  lastSyncResult: Omit<SyncResult, 'syncStatus'> | null
  lastSyncError: string | null
}
