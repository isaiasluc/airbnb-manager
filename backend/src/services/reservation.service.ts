import * as GuestRepo from '../repositories/guest.repository'
import * as ReservationRepo from '../repositories/reservation.repository'
import { sendCheckinEmail } from './reservation-email.service'
import type { CreateReservationInput, ReservationListFilters, ReservationWithGuest, Reservation } from '../types'

const HOST_SERVICE_RATE_CHANGE_DATE = '2026-02-08'

function getHostServiceRate(checkin_at: Date | string): number {
  const checkinDate = new Date(checkin_at).toISOString().slice(0, 10)
  return checkinDate >= HOST_SERVICE_RATE_CHANGE_DATE ? 0.12 : 0.10
}

function calculateHostServiceFee(host_payout: number, checkin_at: Date | string): number {
  const rate = getHostServiceRate(checkin_at)
  return Math.round(host_payout * rate * 100) / 100
}

export async function listReservations(
  filters: ReservationListFilters = {}
): Promise<ReservationWithGuest[]> {
  return ReservationRepo.listReservations(filters)
}

function formatCsvDate(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10)
}

function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''

  const text = String(value)
  if (!/[",\n\r]/.test(text)) return text

  return `"${text.replace(/"/g, '""')}"`
}

export async function exportReservationsCsv(
  filters: ReservationListFilters = {}
): Promise<string> {
  const reservations = await ReservationRepo.listReservations(filters)
  const headers = [
    'Codigo',
    'Hospede',
    'Check-in',
    'Check-out',
    'Hospedes',
    'Payout',
    'Taxa host',
    'Moeda',
    'Servico',
    'Status',
    'Email enviado',
  ]

  const rows = reservations.map((reservation) => [
    reservation.confirmation_code,
    [reservation.guest_first_name, reservation.guest_last_name].filter(Boolean).join(' '),
    formatCsvDate(reservation.checkin_at),
    formatCsvDate(reservation.checkout_at),
    reservation.guests_count,
    reservation.host_payout,
    reservation.host_service_fee,
    reservation.currency,
    reservation.host_service_status,
    reservation.status,
    reservation.email_sent ? 'Sim' : 'Nao',
  ])

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')
}

export async function getReservation(id: number): Promise<ReservationWithGuest> {
  const reservation = await ReservationRepo.findReservationById(id)
  if (!reservation) throw new Error(`Reserva ${id} não encontrada`)
  return reservation
}

export async function createReservation(
  input: CreateReservationInput
): Promise<Reservation> {
  const guest = await GuestRepo.findOrCreateGuest(
    input.guest.first_name,
    input.guest.last_name
  )

  return ReservationRepo.createReservation({
    confirmation_code: input.confirmation_code,
    guest_id:          guest.id,
    checkin_at:        input.checkin_at,
    checkout_at:       input.checkout_at,
    guests_count:      input.guests_count,
    host_payout:       input.host_payout,
    host_service_fee:  calculateHostServiceFee(input.host_payout, input.checkin_at),
    host_service_status: 'pending',
    currency:          input.currency ?? 'BRL',
    source_email_id:   input.source_email_id,
    email_sent:        input.email_sent ?? false,
    status:            'confirmed',
  })
}

export async function updateReservation(
  id: number,
  data: Parameters<typeof ReservationRepo.updateReservation>[1]
): Promise<Reservation> {
  const updateData = { ...data }

  if (updateData.host_payout !== undefined || updateData.checkin_at !== undefined) {
    const reservation = await ReservationRepo.findReservationById(id)
    if (!reservation) throw new Error(`Reserva ${id} não encontrada`)

    const hostPayout = updateData.host_payout !== undefined
      ? Number(updateData.host_payout)
      : Number(reservation.host_payout)
    const checkinAt = updateData.checkin_at ?? reservation.checkin_at
    updateData.host_service_fee = calculateHostServiceFee(hostPayout, checkinAt)
  }

  const updated = await ReservationRepo.updateReservation(id, updateData)
  if (!updated) throw new Error(`Reserva ${id} não encontrada`)
  return updated
}

export async function sendReservationEmail(id: number): Promise<void> {
  const reservation = await getReservation(id)
  await sendCheckinEmail(reservation)
}

export async function deleteReservation(id: number): Promise<void> {
  const deleted = await ReservationRepo.deleteReservation(id)
  if (!deleted) throw new Error(`Reserva ${id} não encontrada`)
}
