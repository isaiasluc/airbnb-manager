import db from '../db'
import type { Reservation, ReservationListFilters, ReservationWithGuest } from '../types'

type OccupancyReservation = Pick<Reservation, 'checkin_at' | 'checkout_at' | 'status'>

export async function listReservations(
  filters: ReservationListFilters = {}
): Promise<ReservationWithGuest[]> {
  const query = db('reservations as r')
    .join('guests as g', 'g.id', 'r.guest_id')
    .select(
      'r.*',
      'g.first_name as guest_first_name',
      'g.last_name  as guest_last_name'
    )

  if (filters.from) {
    query.where('r.checkin_at', '>=', filters.from)
  }

  if (filters.to) {
    query.where('r.checkin_at', '<=', filters.to)
  }

  if (filters.status) {
    query.where('r.status', filters.status)
  }

  return query
    .orderBy('r.checkin_at', 'desc')
}

export async function listReservationsForOccupancy(
  from: string,
  to: string
): Promise<OccupancyReservation[]> {
  return db<Reservation>('reservations')
    .select('checkin_at', 'checkout_at', 'status')
    .whereIn('status', ['confirmed', 'completed'])
    .where('checkout_at', '>', from)
    .where('checkin_at', '<=', to)
    .orderBy('checkin_at', 'asc')
}

export async function getOccupancyDateBounds(): Promise<{
  minCheckin: Date | string | null
  maxCheckout: Date | string | null
}> {
  const row = await db('reservations')
    .whereIn('status', ['confirmed', 'completed'])
    .first<
      { minCheckin: Date | string | null; maxCheckout: Date | string | null } | undefined
    >(
      db.raw('min(checkin_at) as "minCheckin"'),
      db.raw('max(checkout_at) as "maxCheckout"')
    )

  return {
    minCheckin: row?.minCheckin ?? null,
    maxCheckout: row?.maxCheckout ?? null,
  }
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
  data: Partial<Pick<Reservation, 'checkin_at' | 'checkout_at' | 'guests_count' | 'host_payout' | 'host_service_fee' | 'host_service_status' | 'email_sent' | 'status'>>
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
