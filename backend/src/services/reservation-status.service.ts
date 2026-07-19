import db from '../db'
import type { Reservation } from '../types'

export interface RefreshStatusResult {
  started: number
  completed: number
}

/**
 * Status esperado de uma reserva com base nas datas, comparando por timestamp
 * absoluto (checkin_at/checkout_at guardam o horário real em GMT-3):
 *
 * - `completed`   quando o checkout já passou (checkout_at <= now)
 * - `in_progress` durante a estadia (checkin_at <= now < checkout_at)
 * - `confirmed`   antes do check-in (checkin_at > now)
 *
 * Reservas `cancelled` nunca mudam de status e não passam por aqui.
 * A fonte de verdade das transições é esta função; as queries em
 * refreshReservationStatuses implementam exatamente esta lógica em SQL.
 */
export function resolveReservationStatus(
  reservation: Pick<Reservation, 'status' | 'checkin_at' | 'checkout_at'>,
  now: Date = new Date(),
): Reservation['status'] {
  if (reservation.status === 'cancelled' || reservation.status === 'completed') {
    return reservation.status
  }

  const checkin = new Date(reservation.checkin_at).getTime()
  const checkout = new Date(reservation.checkout_at).getTime()
  const nowMs = now.getTime()

  if (checkout <= nowMs) return 'completed'
  if (checkin <= nowMs) return 'in_progress'
  return 'confirmed'
}

/**
 * Avança automaticamente o status das reservas conforme o momento atual:
 * confirmadas cujo check-in chegou viram `in_progress`, e confirmadas ou em
 * andamento cujo checkout passou viram `completed`. Só toca reservas ativas
 * (`confirmed`/`in_progress`) — `cancelled` e `completed` ficam intocadas.
 */
export async function refreshReservationStatuses(
  now: Date = new Date(),
): Promise<RefreshStatusResult> {
  // Concluídas primeiro: checkout já passou.
  const completed = await db<Reservation>('reservations')
    .whereIn('status', ['confirmed', 'in_progress'])
    .where('checkout_at', '<=', now)
    .update({ status: 'completed', updated_at: now })

  // Em andamento: check-in chegou e checkout ainda não passou.
  const started = await db<Reservation>('reservations')
    .where('status', 'confirmed')
    .where('checkin_at', '<=', now)
    .where('checkout_at', '>', now)
    .update({ status: 'in_progress', updated_at: now })

  return { started, completed }
}
