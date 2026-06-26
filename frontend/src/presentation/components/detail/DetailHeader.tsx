import type { Reservation } from '@/domain/entities/reservation'
import { guestName } from '@/domain/services/reservationStats'
import ThemeToggle from '@/presentation/shared/ThemeToggle'
import {
  statusColor,
  statusLabel,
} from '@/presentation/components/reservations/statusPresentation'

export default function DetailHeader({
  reservation,
  onBack,
  onSignOut,
}: {
  reservation: Reservation
  onBack: () => void
  onSignOut: () => void
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-950">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
          aria-label="Voltar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-stone-900 tracking-tight dark:text-stone-100">
            {guestName(reservation.guest_first_name, reservation.guest_last_name)}
          </h1>
          <p className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">
            {reservation.confirmation_code}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
          >
            Sair
          </button>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${statusColor[reservation.status]}`}
          >
            {statusLabel[reservation.status]}
          </span>
        </div>
      </div>
    </header>
  )
}
