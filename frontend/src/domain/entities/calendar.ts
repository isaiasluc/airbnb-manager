import type { Reservation } from './reservation'

export interface StaySegment {
  reservation: Reservation
  /** True when this day is the reservation's check-in date. */
  isCheckIn: boolean
  /** True when the reservation is in progress today (check-in ≤ today < check-out). */
  isActive: boolean
  /** True when the reservation has already ended (check-out ≤ today). */
  isPast: boolean
}

export interface CalendarDay {
  /** Date-only key, 'YYYY-MM-DD'. */
  date: string
  /** Day of the month (1-31). */
  day: number
  /** False for spillover days that belong to the previous/next month. */
  isCurrentMonth: boolean
  isToday: boolean
  /** True when at least one non-cancelled stay occupies this night. */
  isOccupied: boolean
  /** Stays whose occupied nights cover this day (check-in ≤ day < check-out). */
  stays: StaySegment[]
}

export type CalendarWeek = CalendarDay[]
