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
    { label: 'Total', value: reservations.length, money: false },
    { label: 'Confirmadas', value: countByStatus(reservations, 'confirmed'), money: false },
    { label: 'Receita total', value: formatCurrency(sumPayout(billable)), money: true },
    { label: 'Taxa host', value: formatCurrency(sumHostServiceFee(billable)), money: true },
    {
      label: 'Ocupação',
      value: occupancy ? formatOccupancyRate(occupancy.occupancyRate) : '0%',
      hint: occupancy
        ? `${occupancy.occupiedNights}/${occupancy.totalNights} noites`
        : '0/0 noites',
      money: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border border-line bg-surface px-5 py-4 transition-colors dark:border-line-dark dark:bg-surface-dark ${
            stat.money ? 'border-t-2 border-t-accent dark:border-t-accent-dark' : ''
          }`}
        >
          <p className={`mb-1 text-xs uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark`}>
            {stat.label}
          </p>
          <p
            className={`font-display text-2xl font-semibold tabular-nums ${
              stat.money ? 'text-accent dark:text-accent-dark' : 'text-ink dark:text-ink-dark'
            }`}
          >
            {stat.value}
          </p>
          {'hint' in stat && (
            <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
              {stat.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
