import * as GuestRepo from '../repositories/guest.repository'
import * as ReservationRepo from '../repositories/reservation.repository'
import type { CreateReservationInput, ReservationWithGuest, Reservation } from '../types'

export async function listReservations(): Promise<ReservationWithGuest[]> {
  return ReservationRepo.listReservations()
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
    currency:          input.currency ?? 'BRL',
    source_email_id:   input.source_email_id,
    status:            'confirmed',
  })
}

export async function updateReservation(
  id: number,
  data: Parameters<typeof ReservationRepo.updateReservation>[1]
): Promise<Reservation> {
  const updated = await ReservationRepo.updateReservation(id, data)
  if (!updated) throw new Error(`Reserva ${id} não encontrada`)
  return updated
}

export async function deleteReservation(id: number): Promise<void> {
  const deleted = await ReservationRepo.deleteReservation(id)
  if (!deleted) throw new Error(`Reserva ${id} não encontrada`)
}