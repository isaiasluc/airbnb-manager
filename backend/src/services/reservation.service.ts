import * as GuestRepo from '../repositories/guest.repository'
import * as ReservationRepo from '../repositories/reservation.repository'
import { sendCheckinEmail } from './reservation-email.service'
import type {
  CreateReservationInput,
  OccupancyPeriod,
  OccupancyStats,
  ReservationListFilters,
  ReservationWithGuest,
  Reservation,
} from '../types'

const HOST_SERVICE_RATE_CHANGE_DATE = '2026-02-08'
const DAY_MS = 24 * 60 * 60 * 1000
const CHECKIN_EMAIL_WINDOW_DAYS = 7

type DateRange = {
  from: string
  to: string
}

type OccupancyInterval = {
  start: number
  end: number
}

type OccupancyInputReservation = Pick<Reservation, 'checkin_at' | 'checkout_at' | 'status'>

function getHostServiceRate(checkin_at: Date | string): number {
  const checkinDate = new Date(checkin_at).toISOString().slice(0, 10)
  return checkinDate >= HOST_SERVICE_RATE_CHANGE_DATE ? 0.12 : 0.10
}

function calculateHostServiceFee(host_payout: number, checkin_at: Date | string): number {
  const rate = getHostServiceRate(checkin_at)
  return Math.round(host_payout * rate * 100) / 100
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function addDays(value: string, days: number): string {
  const date = parseDateOnly(value)
  date.setUTCDate(date.getUTCDate() + days)
  return formatDateOnly(date)
}

function getMonthStart(value: string): string {
  const date = parseDateOnly(value)
  return formatDateOnly(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)))
}

function getMonthEnd(value: string): string {
  const date = parseDateOnly(value)
  return formatDateOnly(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)))
}

function getCurrentMonthPeriod(): DateRange {
  const now = new Date()
  const from = formatDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
  const to = formatDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)))
  return { from, to }
}

export function resolveOccupancyPeriod(period: OccupancyPeriod = {}): DateRange {
  if (period.from && period.to) return { from: period.from, to: period.to }
  if (period.from) return { from: period.from, to: getMonthEnd(period.from) }
  if (period.to) return { from: getMonthStart(period.to), to: period.to }
  return getCurrentMonthPeriod()
}

async function getAllReservationsPeriod(): Promise<DateRange> {
  const { minCheckin, maxCheckout } = await ReservationRepo.getOccupancyDateBounds()
  if (!minCheckin || !maxCheckout) return getCurrentMonthPeriod()

  const from = formatDateOnly(new Date(minCheckin))
  // checkout_at is exclusive (the guest leaves that day), so the last
  // occupied night is the day before the latest checkout.
  const to = addDays(formatDateOnly(new Date(maxCheckout)), -1)
  return { from, to: to < from ? from : to }
}

function countDays(from: string, exclusiveTo: string): number {
  return Math.max(0, Math.round((parseDateOnly(exclusiveTo).getTime() - parseDateOnly(from).getTime()) / DAY_MS))
}

function dateToTime(value: Date | string): number {
  return parseDateOnly(formatDateOnly(new Date(value))).getTime()
}

export function countOccupiedNights(
  reservations: Pick<Reservation, 'checkin_at' | 'checkout_at'>[],
  period: DateRange
): number {
  const periodStart = parseDateOnly(period.from).getTime()
  const periodEnd = parseDateOnly(addDays(period.to, 1)).getTime()
  const intervals = reservations
    .map((reservation): OccupancyInterval => ({
      start: Math.max(dateToTime(reservation.checkin_at), periodStart),
      end: Math.min(dateToTime(reservation.checkout_at), periodEnd),
    }))
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start)

  const merged = intervals.reduce<OccupancyInterval[]>((acc, interval) => {
    const previous = acc.at(-1)
    if (!previous || interval.start > previous.end) {
      acc.push({ ...interval })
      return acc
    }

    previous.end = Math.max(previous.end, interval.end)
    return acc
  }, [])

  return merged.reduce((total, interval) => total + Math.round((interval.end - interval.start) / DAY_MS), 0)
}

export function calculateOccupancyStats(
  reservations: OccupancyInputReservation[],
  period: DateRange
): OccupancyStats {
  const exclusiveTo = addDays(period.to, 1)
  const totalNights = countDays(period.from, exclusiveTo)
  const occupiableReservations = reservations.filter((reservation) =>
    reservation.status === 'confirmed' || reservation.status === 'completed'
  )
  const occupiedNights = totalNights === 0
    ? 0
    : Math.min(countOccupiedNights(occupiableReservations, period), totalNights)

  return {
    ...period,
    occupiedNights,
    totalNights,
    occupancyRate: totalNights === 0
      ? 0
      : Math.round((occupiedNights / totalNights) * 10000) / 100,
  }
}

export async function listReservations(
  filters: ReservationListFilters = {}
): Promise<ReservationWithGuest[]> {
  return ReservationRepo.listReservations(filters)
}

export async function listActiveReservations(): Promise<ReservationWithGuest[]> {
  return ReservationRepo.listActiveReservations()
}

export async function getCalendarReservations(
  period: OccupancyPeriod
): Promise<ReservationWithGuest[]> {
  const { from, to } = resolveOccupancyPeriod(period)
  return ReservationRepo.listReservationsOverlapping(from, to)
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

export async function getOccupancyStats(
  periodFilters: OccupancyPeriod = {}
): Promise<OccupancyStats> {
  const period =
    periodFilters.from || periodFilters.to
      ? resolveOccupancyPeriod(periodFilters)
      : await getAllReservationsPeriod()
  const reservations = await ReservationRepo.listReservationsForOccupancy(period.from, period.to)
  return calculateOccupancyStats(reservations, period)
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
  await ReservationRepo.updateReservation(id, { email_sent: true })
}

export interface DueCheckinEmailsResult {
  sent: number
  failed: number
  errors: { reservationId: number; message: string }[]
}

/**
 * Envia o email de check-in para as reservas confirmadas cujo check-in
 * está dentro da janela de antecedência (7 dias) e que ainda não tiveram
 * o email enviado. Reservas com check-in para amanhã (antecedência menor
 * que 7 dias) também entram na janela e são enviadas imediatamente.
 */
export async function sendDueCheckinEmails(
  now: Date = new Date()
): Promise<DueCheckinEmailsResult> {
  const today = formatDateOnly(now)
  const windowEnd = addDays(today, CHECKIN_EMAIL_WINDOW_DAYS)
  const dueReservations = await ReservationRepo.listReservationsDueForCheckinEmail(
    today,
    addDays(windowEnd, 1)
  )

  const result: DueCheckinEmailsResult = { sent: 0, failed: 0, errors: [] }

  for (const reservation of dueReservations) {
    try {
      await sendCheckinEmail(reservation)
      await ReservationRepo.updateReservation(reservation.id, { email_sent: true })
      result.sent += 1
    } catch (err) {
      result.failed += 1
      result.errors.push({
        reservationId: reservation.id,
        message: (err as Error).message,
      })
    }
  }

  return result
}

export async function deleteReservation(id: number): Promise<void> {
  const deleted = await ReservationRepo.deleteReservation(id)
  if (!deleted) throw new Error(`Reserva ${id} não encontrada`)
}
