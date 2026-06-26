import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateOccupancyStats } from '../src/services/reservation.service'
import type { Reservation } from '../src/types'

type TestReservation = Pick<Reservation, 'checkin_at' | 'checkout_at' | 'status'>

function reservation(
  checkin_at: string,
  checkout_at: string,
  status: TestReservation['status'] = 'confirmed'
): TestReservation {
  return {
    checkin_at: new Date(`${checkin_at}T00:00:00.000Z`),
    checkout_at: new Date(`${checkout_at}T00:00:00.000Z`),
    status,
  }
}

test('counts normal same-month occupied nights', () => {
  const stats = calculateOccupancyStats([
    reservation('2026-06-10', '2026-06-13'),
  ], { from: '2026-06-01', to: '2026-06-30' })

  assert.equal(stats.occupiedNights, 3)
  assert.equal(stats.totalNights, 30)
  assert.equal(stats.occupancyRate, 10)
})

test('counts only overlapping nights when reservation starts before the period', () => {
  const stats = calculateOccupancyStats([
    reservation('2026-05-28', '2026-06-03'),
  ], { from: '2026-06-01', to: '2026-06-30' })

  assert.equal(stats.occupiedNights, 2)
})

test('counts only overlapping nights when reservation ends after the period', () => {
  const stats = calculateOccupancyStats([
    reservation('2026-06-29', '2026-07-03'),
  ], { from: '2026-06-01', to: '2026-06-30' })

  assert.equal(stats.occupiedNights, 2)
})

test('counts a reservation that fully surrounds the period as full occupancy', () => {
  const stats = calculateOccupancyStats([
    reservation('2026-05-20', '2026-07-05'),
  ], { from: '2026-06-01', to: '2026-06-30' })

  assert.equal(stats.occupiedNights, 30)
  assert.equal(stats.occupancyRate, 100)
})

test('excludes cancelled reservations from occupancy', () => {
  const stats = calculateOccupancyStats([
    reservation('2026-06-10', '2026-06-13', 'cancelled'),
  ], { from: '2026-06-01', to: '2026-06-30' })

  assert.equal(stats.occupiedNights, 0)
  assert.equal(stats.occupancyRate, 0)
})

test('merges overlapping reservations and caps occupancy at the period length', () => {
  const stats = calculateOccupancyStats([
    reservation('2026-06-01', '2026-06-20'),
    reservation('2026-06-10', '2026-07-10', 'completed'),
  ], { from: '2026-06-01', to: '2026-06-30' })

  assert.equal(stats.occupiedNights, 30)
  assert.equal(stats.occupancyRate, 100)
})

test('returns zero occupancy for an empty period result', () => {
  const stats = calculateOccupancyStats([], { from: '2026-06-01', to: '2026-06-30' })

  assert.equal(stats.occupiedNights, 0)
  assert.equal(stats.totalNights, 30)
  assert.equal(stats.occupancyRate, 0)
})
