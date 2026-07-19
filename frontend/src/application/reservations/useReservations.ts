import { useCallback, useEffect, useState } from 'react'
import type { OccupancyStats } from '@/domain/entities/occupancy'
import type { Reservation } from '@/domain/entities/reservation'
import {
  fetchActiveReservations,
  fetchOccupancy,
  fetchReservations,
  type ReservationDateFilters,
} from '@/infrastructure/reservations/reservationApi'

export function useReservations(dateFilters: ReservationDateFilters) {
  const { from, to } = dateFilters
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [active, setActive] = useState<Reservation[]>([])
  const [occupancy, setOccupancy] = useState<OccupancyStats | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(
    async (filters: ReservationDateFilters = { from, to }) => {
      // Reservas em andamento são "agora", independentes do filtro de datas.
      const [data, occupancyStats, activeData] = await Promise.all([
        fetchReservations(filters),
        fetchOccupancy(filters),
        fetchActiveReservations(),
      ])
      setReservations(data)
      setOccupancy(occupancyStats)
      setActive(activeData)
      return data
    },
    [from, to],
  )

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      try {
        const [data, occupancyStats, activeData] = await Promise.all([
          fetchReservations({ from, to }),
          fetchOccupancy({ from, to }),
          fetchActiveReservations(),
        ])
        if (isMounted) {
          setReservations(data)
          setOccupancy(occupancyStats)
          setActive(activeData)
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
    active,
    occupancy,
    setOccupancy,
    loading,
    setLoading,
    reload,
  }
}
