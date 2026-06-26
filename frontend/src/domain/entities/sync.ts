export interface SyncResult {
  imported: number
  skipped: number
  importedItems: SyncItem[]
  skippedItems: SyncItem[]
  errors: { emailId: string; reason: string }[]
  syncStatus?: SyncStatus
}

export interface SyncItem {
  emailId: string
  subject: string
  guestName?: string
  confirmationCode?: string
  reason?: string
}

export interface SyncStatus {
  isRunning: boolean
  lastSyncAt: string | null
  lastSyncSource: 'manual' | 'cron' | null
  lastSyncResult: Omit<SyncResult, 'syncStatus'> | null
  lastSyncError: string | null
}
