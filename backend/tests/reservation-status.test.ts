import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveReservationStatus } from '../src/services/reservation-status.service'
import type { Reservation } from '../src/types'

const NOW = new Date('2026-07-19T12:00:00.000Z')

function reservation(
  checkin_at: string,
  checkout_at: string,
  status: Reservation['status'] = 'confirmed',
): Pick<Reservation, 'status' | 'checkin_at' | 'checkout_at'> {
  return {
    status,
    checkin_at: new Date(checkin_at),
    checkout_at: new Date(checkout_at),
  }
}

test('future reservation stays confirmed', () => {
  const r = reservation('2026-07-25T15:00:00.000Z', '2026-07-30T11:00:00.000Z')
  assert.equal(resolveReservationStatus(r, NOW), 'confirmed')
})

test('active stay becomes in_progress', () => {
  const r = reservation('2026-07-19T09:00:00.000Z', '2026-07-24T11:00:00.000Z')
  assert.equal(resolveReservationStatus(r, NOW), 'in_progress')
})

test('reservation whose check-in instant has not arrived stays confirmed', () => {
  const r = reservation('2026-07-19T15:00:00.000Z', '2026-07-24T11:00:00.000Z')
  assert.equal(resolveReservationStatus(r, NOW), 'confirmed')
})

test('past reservation becomes completed', () => {
  const r = reservation('2026-07-10T15:00:00.000Z', '2026-07-15T11:00:00.000Z')
  assert.equal(resolveReservationStatus(r, NOW), 'completed')
})

test('reservation completed exactly at checkout instant is completed', () => {
  const r = reservation('2026-07-14T15:00:00.000Z', '2026-07-19T12:00:00.000Z')
  assert.equal(resolveReservationStatus(r, NOW), 'completed')
})

test('confirmed that already ended goes straight to completed', () => {
  const r = reservation('2026-07-01T15:00:00.000Z', '2026-07-05T11:00:00.000Z', 'confirmed')
  assert.equal(resolveReservationStatus(r, NOW), 'completed')
})

test('cancelled is never touched', () => {
  const r = reservation('2026-07-10T15:00:00.000Z', '2026-07-15T11:00:00.000Z', 'cancelled')
  assert.equal(resolveReservationStatus(r, NOW), 'cancelled')
})

test('manually completed is not reverted even if dates say active', () => {
  const r = reservation('2026-07-19T09:00:00.000Z', '2026-07-24T11:00:00.000Z', 'completed')
  assert.equal(resolveReservationStatus(r, NOW), 'completed')
})
