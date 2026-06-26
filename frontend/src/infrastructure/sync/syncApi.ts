import type { SyncResult, SyncStatus } from '@/domain/entities/sync'
import { authFetch, BASE } from '../http/apiClient'

export async function syncEmails(): Promise<SyncResult> {
  const res = await authFetch(`${BASE}/sync`, { method: 'POST' })
  if (!res.ok) throw new Error('Erro ao sincronizar emails')
  return res.json()
}

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const res = await authFetch(`${BASE}/sync`)
  if (!res.ok) throw new Error('Erro ao buscar status da sincronização')
  return res.json()
}
