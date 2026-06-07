import db from '../db'
import type { Reservation, ReservationWithGuest } from '../types'

export async function listReservations(): Promise<ReservationWithGuest[]> {
  return db('reservations as r')
    .join('guests as g', 'g.id', 'r.guest_id')
    .select(
      'r.*',
      'g.first_name as guest_first_name',
      'g.last_name  as guest_last_name'
    )
    .orderBy('r.checkin_at', 'desc')
}

export async function findReservationById(
  id: number
): Promise<ReservationWithGuest | undefined> {
  return db('reservations as r')
    .join('guests as g', 'g.id', 'r.guest_id')
    .select(
      'r.*',
      'g.first_name as guest_first_name',
      'g.last_name  as guest_last_name'
    )
    .where('r.id', id)
    .first()
}

export async function createReservation(
  data: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>
): Promise<Reservation> {
  const [created] = await db<Reservation>('reservations')
    .insert(data)
    .returning('*')
  return created
}

export async function updateReservation(
  id: number,
  data: Partial<Pick<Reservation, 'checkin_at' | 'checkout_at' | 'guests_count' | 'host_payout' | 'status'>>
): Promise<Reservation | undefined> {
  const [updated] = await db<Reservation>('reservations')
    .where({ id })
    .update(data)
    .returning('*')
  return updated
}

export async function deleteReservation(id: number): Promise<boolean> {
  const count = await db('reservations').where({ id }).delete()
  return count > 0
}

export async function reservationExistsByEmailId(
  source_email_id: string
): Promise<boolean> {
  const row = await db('reservations').where({ source_email_id }).first()
  return !!row
}