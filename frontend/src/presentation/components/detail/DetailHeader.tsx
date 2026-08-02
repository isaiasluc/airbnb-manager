import type { Reservation } from '@/domain/entities/reservation'
import { guestName } from '@/domain/services/reservationStats'
import ThemeToggle from '@/presentation/shared/ThemeToggle'
import { buttonSignOut, iconButton } from '@/presentation/shared/buttonStyles'
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
    <header className="sticky top-0 z-10 border-b border-line bg-surface transition-colors dark:border-line-dark dark:bg-surface-dark">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className={iconButton} aria-label="Voltar">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-ink-dark">
            {guestName(reservation.guest_first_name, reservation.guest_last_name)}
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-muted-dark">
            {reservation.confirmation_code}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${statusColor[reservation.status]}`}
          >
            {statusLabel[reservation.status]}
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button type="button" onClick={onSignOut} className={buttonSignOut}>
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
