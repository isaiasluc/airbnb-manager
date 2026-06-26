import type { OccupancyStats, Reservation, SyncResult, SyncStatus } from './types';
import { auth } from './firebase';

const BASE = import.meta.env.VITE_API_URL ?? '/api'

async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const token = await auth.currentUser?.getIdToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(input, {
    ...init,
    headers,
  })
}

export interface ReservationDateFilters {
  from?: string
  to?: string
}

export interface ReservationExportFilters extends ReservationDateFilters {
  status?: Reservation['status']
}

export interface GoogleAuthStatus {
  authenticated: boolean
}

export async function fetchReservations(
  filters: ReservationDateFilters = {},
): Promise<Reservation[]> {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)

  const query = params.size ? `?${params.toString()}` : ''
  const res = await authFetch(`${BASE}/reservations${query}`)
  if (!res.ok) throw new Error('Erro ao buscar reservas')
  return res.json()
}

export async function fetchOccupancy(
  filters: ReservationDateFilters = {},
): Promise<OccupancyStats> {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)

  const query = params.size ? `?${params.toString()}` : ''
  const res = await authFetch(`${BASE}/reservations/occupancy${query}`)
  if (!res.ok) throw new Error('Erro ao buscar ocupação')
  return res.json()
}

export async function exportReservationsCsv(
  filters: ReservationExportFilters = {},
): Promise<Blob> {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.status) params.set('status', filters.status)

  const query = params.size ? `?${params.toString()}` : ''
  const res = await authFetch(`${BASE}/reservations/export${query}`)
  if (!res.ok) throw new Error('Erro ao exportar CSV')
  return res.blob()
}

export async function fetchReservation(id: number): Promise<Reservation> {
  const res = await authFetch(`${BASE}/reservations/${id}`)
  if (!res.ok) throw new Error('Reserva não encontrada')
  return res.json()
}

export async function updateReservation(
  id: number,
  data: Partial<Pick<Reservation, 'status' | 'email_sent' | 'checkin_at' | 'checkout_at' | 'guests_count' | 'host_payout' | 'host_service_fee' | 'host_service_status'>>
): Promise<Reservation> {
  const res = await authFetch(`${BASE}/reservations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erro ao atualizar reserva')
  return res.json()
}

export async function sendReservationEmail(id: number): Promise<void> {
  const res = await authFetch(`${BASE}/reservations/${id}/send-email`, {
    method: 'POST',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(data?.error ?? 'Erro ao enviar email')
  }
}

export async function deleteReservation(id: number): Promise<void> {
  const res = await authFetch(`${BASE}/reservations/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erro ao deletar reserva')
}

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

export async function fetchGoogleAuthStatus(): Promise<GoogleAuthStatus> {
  const res = await authFetch(`${BASE}/google-auth/status`)
  if (!res.ok) throw new Error('Erro ao buscar autenticação Google')
  return res.json()
}

export async function startGoogleAuth(): Promise<string> {
  const res = await authFetch(`${BASE}/google-auth/start`, { method: 'POST' })
  if (!res.ok) throw new Error('Erro ao iniciar autenticação Google')
  const data = await res.json() as { authUrl?: string }
  if (!data.authUrl) throw new Error('URL de autenticação Google não encontrada')
  return data.authUrl
}
