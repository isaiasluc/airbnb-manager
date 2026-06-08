import type { Reservation, SyncResult } from './types'

const BASE = '/api'

export async function fetchReservations(): Promise<Reservation[]> {
  const res = await fetch(`${BASE}/reservations`)
  if (!res.ok) throw new Error('Erro ao buscar reservas')
  return res.json()
}

export async function fetchReservation(id: number): Promise<Reservation> {
  const res = await fetch(`${BASE}/reservations/${id}`)
  if (!res.ok) throw new Error('Reserva não encontrada')
  return res.json()
}

export async function updateReservation(
  id: number,
  data: Partial<Pick<Reservation, 'status' | 'email_sent' | 'checkin_at' | 'checkout_at' | 'guests_count' | 'host_payout'>>
): Promise<Reservation> {
  const res = await fetch(`${BASE}/reservations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erro ao atualizar reserva')
  return res.json()
}

export async function deleteReservation(id: number): Promise<void> {
  const res = await fetch(`${BASE}/reservations/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erro ao deletar reserva')
}

export async function syncEmails(): Promise<SyncResult> {
  const res = await fetch(`${BASE}/sync`, { method: 'POST' })
  if (!res.ok) throw new Error('Erro ao sincronizar emails')
  return res.json()
}
