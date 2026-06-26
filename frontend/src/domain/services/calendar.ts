import type {
  CalendarDay,
  CalendarWeek,
  StaySegment,
} from '../entities/calendar'
import type { Reservation } from '../entities/reservation'

const WEEKS = 6
const DAYS_IN_WEEK = 7

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Reduces any date or ISO string to a 'YYYY-MM-DD' key in UTC, so that
 * comparisons stay free of timezone drift.
 */
export function toDateOnly(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10)
}

/** 'YYYY-MM' key for the given (or current) month, in local time. */
export function currentMonthKey(today: Date = new Date()): string {
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}`
}

export function isValidMonthKey(key: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(key)
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number)
  return { year, month }
}

/** Shifts a 'YYYY-MM' key by a number of months, rolling the year over. */
export function addMonths(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key)
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`
}

/** First and last calendar day of the month itself (no spillover). */
export function getMonthRange(
  year: number,
  month: number,
): { from: string; to: string } {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(lastDay)}`,
  }
}

/**
 * The full range of days rendered by the grid for a given month, including the
 * spillover days from adjacent months. Used to fetch every reservation that
 * touches the visible calendar.
 */
export function getMonthGridRange(
  year: number,
  month: number,
): { from: string; to: string } {
  const gridStart = getGridStart(year, month)
  const gridEnd = new Date(gridStart)
  gridEnd.setUTCDate(gridEnd.getUTCDate() + WEEKS * DAYS_IN_WEEK - 1)
  return { from: toDateOnly(gridStart), to: toDateOnly(gridEnd) }
}

/**
 * Builds a Sunday-first month grid (6 weeks) where each day knows which
 * reservations occupy its night.
 *
 * @param month 1-12
 */
export function buildMonthGrid(
  year: number,
  month: number,
  reservations: Reservation[],
  today: Date = new Date(),
): CalendarWeek[] {
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  const bounds = reservations.map((reservation) => ({
    reservation,
    checkin: toDateOnly(reservation.checkin_at),
    checkout: toDateOnly(reservation.checkout_at),
  }))

  const cursor = getGridStart(year, month)
  const weeks: CalendarWeek[] = []

  for (let week = 0; week < WEEKS; week++) {
    const days: CalendarDay[] = []

    for (let day = 0; day < DAYS_IN_WEEK; day++) {
      const date = toDateOnly(cursor)
      const stays: StaySegment[] = bounds
        .filter((b) => b.checkin <= date && date < b.checkout)
        .map((b) => ({
          reservation: b.reservation,
          isCheckIn: b.checkin === date,
          isActive: b.checkin <= todayStr && todayStr < b.checkout,
        }))

      days.push({
        date,
        day: cursor.getUTCDate(),
        isCurrentMonth: cursor.getUTCMonth() === month - 1,
        isToday: date === todayStr,
        isOccupied: stays.some((s) => s.reservation.status !== 'cancelled'),
        stays,
      })

      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    weeks.push(days)
  }

  return weeks
}

function getGridStart(year: number, month: number): Date {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1))
  const gridStart = new Date(firstOfMonth)
  gridStart.setUTCDate(gridStart.getUTCDate() - firstOfMonth.getUTCDay())
  return gridStart
}
