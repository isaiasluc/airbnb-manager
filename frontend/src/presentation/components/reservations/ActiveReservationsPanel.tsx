import type { Reservation } from '@/domain/entities/reservation'
import { guestName } from '@/domain/services/reservationStats'
import { formatDate } from '@/presentation/shared/format'

const MS_DAY = 86400000

// checkout_at é exclusivo (o hóspede sai nesse dia). Conta em dias-cheios (UTC)
// para casar com formatDate, que também usa UTC.
function checkoutCountdown(checkout: string): string {
  const now = new Date()
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const co = new Date(checkout)
  const coUTC = Date.UTC(co.getUTCFullYear(), co.getUTCMonth(), co.getUTCDate())
  const days = Math.round((coUTC - todayUTC) / MS_DAY)

  if (days <= 0) return 'sai hoje'
  if (days === 1) return 'sai amanhã'
  return `sai em ${days} dias`
}

export default function ActiveReservationsPanel({
  reservations,
  onSelect,
}: {
  reservations: Reservation[]
  onSelect: (id: number) => void
}) {
  if (reservations.length === 0) return null

  return (
    <section className="mb-8 rounded-xl border border-blue-200 bg-blue-50/50 px-5 py-4 transition-colors dark:border-blue-900/60 dark:bg-blue-950/30">
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
        <p className="text-xs font-medium uppercase tracking-widest text-blue-700 dark:text-blue-300">
          Em andamento agora · {reservations.length}
        </p>
      </div>

      <ul className="divide-y divide-blue-100 dark:divide-blue-900/40">
        {reservations.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(r.id)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-opacity hover:opacity-70"
            >
              <span className="font-medium text-stone-800 dark:text-stone-100">
                {guestName(r.guest_first_name, r.guest_last_name)}
              </span>
              <span className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                <span className="hidden sm:inline">
                  {formatDate(r.checkin_at)} → {formatDate(r.checkout_at)}
                </span>
                <span className="whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {checkoutCountdown(r.checkout_at)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
