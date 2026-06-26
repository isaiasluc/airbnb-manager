import { useCallback, useEffect, useState } from 'react'
import type { OccupancyStats } from '@/domain/entities/occupancy'
import type { Reservation } from '@/domain/entities/reservation'
import {
  fetchOccupancy,
  fetchReservations,
  type ReservationDateFilters,
} from '@/infrastructure/reservations/reservationApi'

export function useReservations(dateFilters: ReservationDateFilters) {
  const { from, to } = dateFilters
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [occupancy, setOccupancy] = useState<OccupancyStats | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(
    async (filters: ReservationDateFilters = { from, to }) => {
      const [data, occupancyStats] = await Promise.all([
        fetchReservations(filters),
        fetchOccupancy(filters),
      ])
      setReservations(data)
      setOccupancy(occupancyStats)
      return data
    },
    [from, to],
  )

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      try {
        const [data, occupancyStats] = await Promise.all([
          fetchReservations({ from, to }),
          fetchOccupancy({ from, to }),
        ])
        if (isMounted) {
          setReservations(data)
          setOccupancy(occupancyStats)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [from, to])

  return {
    reservations,
    setReservations,
    occupancy,
    setOccupancy,
    loading,
    setLoading,
    reload,
  }
}
