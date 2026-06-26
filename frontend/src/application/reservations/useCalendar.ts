import { useEffect, useMemo, useState } from 'react'
import type { Reservation } from '@/domain/entities/reservation'
import {
  buildMonthGrid,
  getMonthGridRange,
  parseMonthKey,
} from '@/domain/services/calendar'
import { fetchCalendarReservations } from '@/infrastructure/reservations/reservationApi'

export function useCalendar(month: string) {
  const { year, month: monthNum } = parseMonthKey(month)
  const { from, to } = getMonthGridRange(year, monthNum)

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      try {
        const data = await fetchCalendarReservations(from, to)
        if (isMounted) setReservations(data)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [from, to])

  const weeks = useMemo(
    () => buildMonthGrid(year, monthNum, reservations),
    [year, monthNum, reservations],
  )

  return { weeks, loading, year, month: monthNum }
}
