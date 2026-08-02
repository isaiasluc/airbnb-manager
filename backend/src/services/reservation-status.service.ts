import db from '../db'
import type { Reservation } from '../types'

export interface RefreshStatusResult {
  started: number
  completed: number
}

// checkin_at/checkout_at guardam só a DATA (coluna DATE — ver migração
// 20240002_alter_reservations.ts, que descartou a hora de propósito). O
// e-mail do Airbnb não tem mais o horário exato disponível para a regra de
// status, então assumimos um horário fixo de corte, horário de Brasília.
const CHECKIN_HOUR = '14:00'
const CHECKOUT_HOUR = '11:00'
const TIMEZONE = 'America/Sao_Paulo'

function toDateOnly(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10)
}

/** Instante (epoch ms) do horário de corte, no fuso de Brasília, para uma data 'YYYY-MM-DD'. */
function cutoffInstant(dateOnly: string, hour: string): number {
  return new Date(`${dateOnly}T${hour}:00-03:00`).getTime()
}

/**
 * Status esperado de uma reserva com base nas datas: como checkin_at/
 * checkout_at guardam só a data, assumimos check-in às 14h e checkout às
 * 11h (horário de Brasília) para decidir a transição:
 *
 * - `completed`   quando o checkout (dia + 11h) já passou
 * - `in_progress` durante a estadia (checkin (dia + 14h) já passou, checkout ainda não)
 * - `confirmed`   antes do check-in
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

  const checkin = cutoffInstant(toDateOnly(reservation.checkin_at), CHECKIN_HOUR)
  const checkout = cutoffInstant(toDateOnly(reservation.checkout_at), CHECKOUT_HOUR)
  const nowMs = now.getTime()

  if (checkout <= nowMs) return 'completed'
  if (checkin <= nowMs) return 'in_progress'
  return 'confirmed'
}

/**
 * Avança automaticamente o status das reservas conforme o momento atual:
 * confirmadas cujo check-in (dia + 14h, horário de Brasília) chegou viram
 * `in_progress`, e confirmadas ou em andamento cujo checkout (dia + 11h)
 * passou viram `completed`. Só toca reservas ativas (`confirmed`/
 * `in_progress`) — `cancelled` e `completed` ficam intocadas.
 */
export async function refreshReservationStatuses(
  now: Date = new Date(),
): Promise<RefreshStatusResult> {
  const checkoutCutoff = `(checkout_at + TIME '${CHECKOUT_HOUR}') AT TIME ZONE '${TIMEZONE}'`
  const checkinCutoff = `(checkin_at + TIME '${CHECKIN_HOUR}') AT TIME ZONE '${TIMEZONE}'`

  // Concluídas primeiro: checkout já passou.
  const completed = await db<Reservation>('reservations')
    .whereIn('status', ['confirmed', 'in_progress'])
    .whereRaw(`${checkoutCutoff} <= ?`, [now])
    .update({ status: 'completed', updated_at: now })

  // Em andamento: check-in chegou e checkout ainda não passou.
  const started = await db<Reservation>('reservations')
    .where('status', 'confirmed')
    .whereRaw(`${checkinCutoff} <= ?`, [now])
    .whereRaw(`${checkoutCutoff} > ?`, [now])
    .update({ status: 'in_progress', updated_at: now })

  return { started, completed }
}
