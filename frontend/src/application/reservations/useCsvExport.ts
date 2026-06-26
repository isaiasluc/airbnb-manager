import { useState } from 'react'
import {
  exportReservationsCsv,
  type ReservationExportFilters,
} from '@/infrastructure/reservations/reservationApi'

export function useCsvExport() {
  const [exportingCsv, setExportingCsv] = useState(false)

  async function exportCsv(filters: ReservationExportFilters) {
    setExportingCsv(true)
    try {
      const csv = await exportReservationsCsv(filters)
      const url = window.URL.createObjectURL(csv)
      const link = document.createElement('a')
      const suffix = [filters.from || 'inicio', filters.to || 'fim']
        .join('_')
        .replace(/[^a-z0-9_-]/gi, '')
      link.href = url
      link.download = `reservas_${suffix}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setExportingCsv(false)
    }
  }

  return { exportingCsv, exportCsv }
}
