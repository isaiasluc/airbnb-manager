import type { OccupancyStats } from '@/domain/entities/occupancy'
import type { Reservation } from '@/domain/entities/reservation'
import { authFetch, BASE, buildQuery } from '../http/apiClient'

export interface ReservationDateFilters {
  from?: string
  to?: string
}

export interface ReservationExportFilters extends ReservationDateFilters {
  status?: Reservation['status']
}

export async function fetchReservations(
  filters: ReservationDateFilters = {},
): Promise<Reservation[]> {
  const query = buildQuery({ from: filters.from, to: filters.to })
  const res = await authFetch(`${BASE}/reservations${query}`)
  if (!res.ok) throw new Error('Erro ao buscar reservas')
  return res.json()
}

export async function fetchOccupancy(
  filters: ReservationDateFilters = {},
): Promise<OccupancyStats> {
  const query = buildQuery({ from: filters.from, to: filters.to })
  const res = await authFetch(`${BASE}/reservations/occupancy${query}`)
  if (!res.ok) throw new Error('Erro ao buscar ocupação')
  return res.json()
}

export async function fetchCalendarReservations(
  from: string,
  to: string,
): Promise<Reservation[]> {
  const query = buildQuery({ from, to })
  const res = await authFetch(`${BASE}/reservations/calendar${query}`)
  if (!res.ok) throw new Error('Erro ao buscar reservas do calendário')
  return res.json()
}

export async function exportReservationsCsv(
  filters: ReservationExportFilters = {},
): Promise<Blob> {
  const query = buildQuery({
    from: filters.from,
    to: filters.to,
    status: filters.status,
  })
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
  data: Partial<
    Pick<
      Reservation,
      | 'status'
      | 'email_sent'
      | 'checkin_at'
      | 'checkout_at'
      | 'guests_count'
      | 'host_payout'
      | 'host_service_fee'
      | 'host_service_status'
    >
  >,
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
    const data = (await res.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(data?.error ?? 'Erro ao enviar email')
  }
}

export async function deleteReservation(id: number): Promise<void> {
  const res = await authFetch(`${BASE}/reservations/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erro ao deletar reserva')
}
