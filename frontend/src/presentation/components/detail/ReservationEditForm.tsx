import { useState, type FormEvent } from 'react'
import type { Reservation } from '@/domain/entities/reservation'
import { nightsCount } from '@/domain/services/reservationStats'
import { buttonPrimary, buttonSecondary } from '@/presentation/shared/buttonStyles'

const INPUT_CLASS =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-accent-dark'

const LABEL_CLASS =
  'mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark'

export interface ReservationEditValues {
  checkin_at: string
  checkout_at: string
  guests_count: number
  host_payout: number
}

/** A API devolve a coluna DATE como ISO à meia-noite UTC; o input quer 'AAAA-MM-DD'. */
function toDateInput(value: string): string {
  return value.slice(0, 10)
}

export default function ReservationEditForm({
  reservation,
  saving,
  error,
  onSave,
  onCancel,
}: {
  reservation: Reservation
  saving: boolean
  error: string | null
  onSave: (values: Partial<ReservationEditValues>) => void
  onCancel: () => void
}) {
  const initial: ReservationEditValues = {
    checkin_at: toDateInput(reservation.checkin_at),
    checkout_at: toDateInput(reservation.checkout_at),
    guests_count: Number(reservation.guests_count),
    host_payout: Number(reservation.host_payout),
  }
  const [form, setForm] = useState<ReservationEditValues>(initial)

  const nights =
    form.checkin_at && form.checkout_at ? nightsCount(form.checkin_at, form.checkout_at) : 0
  const invalidDates = nights < 1

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (invalidDates) return

    // Só manda o que mudou: assim o payout não limpa o aviso sem ter sido editado.
    const changed = Object.fromEntries(
      (Object.keys(form) as (keyof ReservationEditValues)[])
        .filter((field) => form[field] !== initial[field])
        .map((field) => [field, form[field]]),
    ) as Partial<ReservationEditValues>

    if (Object.keys(changed).length === 0) {
      onCancel()
      return
    }
    onSave(changed)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-line bg-surface transition-colors dark:border-line-dark dark:bg-surface-dark"
    >
      <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-checkin" className={LABEL_CLASS}>
            Check-in
          </label>
          <input
            id="edit-checkin"
            type="date"
            required
            value={form.checkin_at}
            onChange={(e) => setForm((f) => ({ ...f, checkin_at: e.target.value }))}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="edit-checkout" className={LABEL_CLASS}>
            Check-out
          </label>
          <input
            id="edit-checkout"
            type="date"
            required
            min={form.checkin_at || undefined}
            value={form.checkout_at}
            onChange={(e) => setForm((f) => ({ ...f, checkout_at: e.target.value }))}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="edit-guests" className={LABEL_CLASS}>
            Hóspedes
          </label>
          <input
            id="edit-guests"
            type="number"
            required
            min="1"
            step="1"
            value={form.guests_count || ''}
            onChange={(e) => setForm((f) => ({ ...f, guests_count: Number(e.target.value) }))}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="edit-payout" className={LABEL_CLASS}>
            Repasse do host (R$)
          </label>
          <input
            id="edit-payout"
            type="number"
            required
            min="0"
            step="0.01"
            value={Number.isNaN(form.host_payout) ? '' : form.host_payout}
            onChange={(e) => setForm((f) => ({ ...f, host_payout: Number(e.target.value) }))}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 dark:border-line-dark">
        <p
          className={`text-sm ${invalidDates ? 'text-rose-500' : 'text-ink-muted dark:text-ink-muted-dark'}`}
          aria-live="polite"
        >
          {invalidDates ? (
            'O check-out precisa ser depois do check-in'
          ) : (
            <>
              <strong className="text-ink dark:text-ink-dark">{nights}</strong> noite
              {nights !== 1 ? 's' : ''} · saída no dia do check-out
            </>
          )}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className={buttonSecondary}>
            Cancelar
          </button>
          <button type="submit" disabled={saving || invalidDates} className={buttonPrimary}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="border-t border-line px-6 py-3 text-sm text-rose-500 dark:border-line-dark">
          {error}
        </p>
      )}
    </form>
  )
}
