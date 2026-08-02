import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveReservationStatus } from '../src/services/reservation-status.service'
import type { Reservation } from '../src/types'

// checkin_at/checkout_at são colunas DATE (sem hora) — passamos só a data,
// como o banco realmente guarda, e o horário de corte (14h/11h) é aplicado
// internamente por resolveReservationStatus.
const NOW_MORNING = new Date('2026-07-19T12:00:00.000Z') // 09:00 GMT-3
const NOW_AFTERNOON = new Date('2026-07-19T18:00:00.000Z') // 15:00 GMT-3
const NOW_AT_CHECKOUT_CUTOFF = new Date('2026-07-19T14:00:00.000Z') // 11:00 GMT-3 em ponto

function reservation(
  checkin_at: string,
  checkout_at: string,
  status: Reservation['status'] = 'confirmed',
): Pick<Reservation, 'status' | 'checkin_at' | 'checkout_at'> {
  return {
    status,
    checkin_at: new Date(`${checkin_at}T00:00:00.000Z`),
    checkout_at: new Date(`${checkout_at}T00:00:00.000Z`),
  }
}

test('future reservation stays confirmed', () => {
  const r = reservation('2026-07-25', '2026-07-30')
  assert.equal(resolveReservationStatus(r, NOW_MORNING), 'confirmed')
})

test('active stay becomes in_progress', () => {
  const r = reservation('2026-07-15', '2026-07-24')
  assert.equal(resolveReservationStatus(r, NOW_MORNING), 'in_progress')
})

test('check-in is today but the 14h cutoff has not arrived yet: stays confirmed', () => {
  const r = reservation('2026-07-19', '2026-07-24')
  assert.equal(resolveReservationStatus(r, NOW_MORNING), 'confirmed')
})

test('check-in is today and the 14h cutoff already passed: becomes in_progress', () => {
  const r = reservation('2026-07-19', '2026-07-24')
  assert.equal(resolveReservationStatus(r, NOW_AFTERNOON), 'in_progress')
})

test('past reservation becomes completed', () => {
  const r = reservation('2026-07-10', '2026-07-15')
  assert.equal(resolveReservationStatus(r, NOW_MORNING), 'completed')
})

test('reservation completed exactly at the 11h checkout cutoff', () => {
  const r = reservation('2026-07-14', '2026-07-19')
  assert.equal(resolveReservationStatus(r, NOW_AT_CHECKOUT_CUTOFF), 'completed')
})

test('confirmed that already ended goes straight to completed', () => {
  const r = reservation('2026-07-01', '2026-07-05', 'confirmed')
  assert.equal(resolveReservationStatus(r, NOW_MORNING), 'completed')
})

test('cancelled is never touched', () => {
  const r = reservation('2026-07-10', '2026-07-15', 'cancelled')
  assert.equal(resolveReservationStatus(r, NOW_MORNING), 'cancelled')
})

test('manually completed is not reverted even if dates say active', () => {
  const r = reservation('2026-07-15', '2026-07-24', 'completed')
  assert.equal(resolveReservationStatus(r, NOW_MORNING), 'completed')
})
