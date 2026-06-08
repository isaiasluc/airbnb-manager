import type { SyncResult } from './gmail.service'
import { syncGmailReservations } from './gmail.service'

export type SyncSource = 'manual' | 'cron'

export interface SyncStatus {
  isRunning: boolean
  lastSyncAt: string | null
  lastSyncSource: SyncSource | null
  lastSyncResult: SyncResult | null
  lastSyncError: string | null
}

const status: SyncStatus = {
  isRunning: false,
  lastSyncAt: null,
  lastSyncSource: null,
  lastSyncResult: null,
  lastSyncError: null,
}

export function getSyncStatus(): SyncStatus {
  return { ...status }
}

export async function runGmailSync(source: SyncSource): Promise<SyncResult> {
  if (status.isRunning) {
    throw new Error('Sincronização já está em andamento')
  }

  status.isRunning = true
  status.lastSyncSource = source

  try {
    const result = await syncGmailReservations()
    status.lastSyncAt = new Date().toISOString()
    status.lastSyncResult = result
    status.lastSyncError = null

    return result
  } catch (err) {
    status.lastSyncError = (err as Error).message
    throw err
  } finally {
    status.isRunning = false
  }
}
