import type { Reservation, ReservationStatus } from '../entities/reservation'

export const RESERVATION_FILTERS = [
  'all',
  'confirmed',
  'completed',
  'cancelled',
] as const

export type ReservationFilter = (typeof RESERVATION_FILTERS)[number]

export function guestName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(' ')
}

export function nightsCount(checkin: string, checkout: string): number {
  const a = new Date(checkin)
  const b = new Date(checkout)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function filterByStatus(
  reservations: Reservation[],
  filter: ReservationFilter,
): Reservation[] {
  return filter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === filter)
}

export function isBillable(reservation: Reservation): boolean {
  return reservation.status !== 'cancelled'
}

export function countByStatus(
  reservations: Reservation[],
  status: ReservationStatus,
): number {
  return reservations.filter((r) => r.status === status).length
}

export function sumPayout(reservations: Reservation[]): number {
  return reservations.reduce((sum, r) => sum + Number(r.host_payout), 0)
}

export function sumHostServiceFee(reservations: Reservation[]): number {
  return reservations.reduce((sum, r) => sum + Number(r.host_service_fee), 0)
}
