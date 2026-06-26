import type { OccupancyStats } from '@/domain/entities/occupancy'
import type { Reservation } from '@/domain/entities/reservation'
import {
  countByStatus,
  isBillable,
  sumHostServiceFee,
  sumPayout,
} from '@/domain/services/reservationStats'
import { formatCurrency, formatOccupancyRate } from '@/presentation/shared/format'

export default function StatsCards({
  reservations,
  occupancy,
}: {
  reservations: Reservation[]
  occupancy: OccupancyStats | null
}) {
  const billable = reservations.filter(isBillable)
  const stats = [
    { label: 'Total', value: reservations.length },
    { label: 'Confirmadas', value: countByStatus(reservations, 'confirmed') },
    { label: 'Receita total', value: formatCurrency(sumPayout(billable)) },
    { label: 'Taxa host', value: formatCurrency(sumHostServiceFee(billable)) },
    {
      label: 'Ocupação',
      value: occupancy ? formatOccupancyRate(occupancy.occupancyRate) : '0%',
      hint: occupancy
        ? `${occupancy.occupiedNights}/${occupancy.totalNights} noites`
        : '0/0 noites',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-stone-200 bg-white px-5 py-4 transition-colors dark:border-stone-800 dark:bg-stone-900"
        >
          <p className="mb-1 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
            {stat.label}
          </p>
          <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {stat.value}
          </p>
          {'hint' in stat && (
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              {stat.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
