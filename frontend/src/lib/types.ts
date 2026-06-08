export interface Guest {
  id: number
  first_name: string
  last_name: string
}

export interface Reservation {
  id: number
  confirmation_code: string
  guest_id: number
  guest_first_name: string
  guest_last_name: string
  checkin_at: string
  checkout_at: string
  guests_count: number
  host_payout: number
  host_service_fee: number
  host_service_status: 'pending' | 'paid' | 'cancelled'
  currency: string
  source_email_id: string
  email_sent: boolean
  status: 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  updated_at: string
}

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
