import type { Reservation } from '@/domain/entities/reservation'
import { buttonPrimary } from '@/presentation/shared/buttonStyles'
import { statusLabel } from '@/presentation/components/reservations/statusPresentation'

const STATUSES = ['confirmed', 'in_progress', 'completed', 'cancelled'] as const

export default function ReservationActions({
  reservation,
  saving,
  sendingEmail,
  emailError,
  onSendEmail,
  onToggleEmailSent,
  onChangeStatus,
}: {
  reservation: Reservation
  saving: boolean
  sendingEmail: boolean
  emailError: string | null
  onSendEmail: () => void
  onToggleEmailSent: () => void
  onChangeStatus: (status: Reservation['status']) => void
}) {
  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface px-6 py-5 transition-colors dark:border-line-dark dark:bg-surface-dark">
      <p className="text-xs uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">
        Ações
      </p>

      <button
        type="button"
        onClick={onSendEmail}
        disabled={sendingEmail || saving || reservation.email_sent}
        className={`w-full disabled:cursor-not-allowed ${buttonPrimary}`}
      >
        {sendingEmail
          ? 'Enviando...'
          : reservation.email_sent
            ? 'E-mail enviado'
            : 'Enviar e-mail'}
      </button>
      {emailError && (
        <p className="text-sm text-red-500 dark:text-red-400">{emailError}</p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink dark:text-ink-dark">
            Email enviado
          </p>
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
            Marque após enviar as informações de check-in
          </p>
        </div>
        <button
          onClick={onToggleEmailSent}
          disabled={saving || sendingEmail}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
            reservation.email_sent
              ? 'bg-accent dark:bg-accent-dark'
              : 'bg-line dark:bg-line-dark'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
              reservation.email_sent ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink dark:text-ink-dark">
          Alterar status
        </p>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => onChangeStatus(s)}
              disabled={saving || reservation.status === s}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
                reservation.status === s
                  ? 'bg-accent text-white dark:bg-accent-dark dark:text-ink'
                  : 'bg-paper text-ink-muted hover:bg-line/60 dark:bg-paper-dark dark:text-ink-muted-dark dark:hover:bg-line-dark/60'
              }`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
