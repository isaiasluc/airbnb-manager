import type { Knex } from 'knex'

/**
 * Alinha as reservas já canceladas com a regra nova: reserva cancelada não
 * gera repasse, então a taxa de serviço do host vai junto para `cancelled`.
 *
 * Só toca as que estão `pending` — se a taxa foi marcada como `paid` na mão,
 * o dinheiro já se moveu e a marcação manual é preservada.
 */
export async function up(knex: Knex): Promise<void> {
  await knex('reservations')
    .where({ status: 'cancelled', host_service_status: 'pending' })
    .update({ host_service_status: 'cancelled' })
}

export async function down(knex: Knex): Promise<void> {
  await knex('reservations')
    .where({ status: 'cancelled', host_service_status: 'cancelled' })
    .update({ host_service_status: 'pending' })
}
