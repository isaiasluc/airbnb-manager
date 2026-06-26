import type { Reservation } from '@/domain/entities/reservation'
import { statusLabel } from '@/presentation/components/reservations/statusPresentation'

const STATUSES = ['confirmed', 'completed', 'cancelled'] as const

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
    <div className="space-y-4 rounded-xl border border-stone-200 bg-white px-6 py-5 transition-colors dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
        Ações
      </p>

      <button
        type="button"
        onClick={onSendEmail}
        disabled={sendingEmail || saving || reservation.email_sent}
        className="inline-flex w-full items-center justify-center rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
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
          <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
            Email enviado
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Marque após enviar as informações de check-in
          </p>
        </div>
        <button
          onClick={onToggleEmailSent}
          disabled={saving || sendingEmail}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
            reservation.email_sent
              ? 'bg-stone-900 dark:bg-stone-100'
              : 'bg-stone-200 dark:bg-stone-700'
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
        <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-200">
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
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
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
