import type { Knex } from 'knex'

// Campos usados pelo passo de alterações do sync do Gmail:
// - payout_needs_review: a alteração mudou datas/hóspedes, mas os e-mails do
//   Airbnb não trazem o payout novo — o dono precisa conferir o valor.
// - last_alteration_at: recebimento do último "Reservation updated" aplicado,
//   para o sync não reprocessar alterações antigas (idempotência).
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reservations', (t) => {
    t.boolean('payout_needs_review').notNullable().defaultTo(false)
    t.timestamp('last_alteration_at', { useTz: true }).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reservations', (t) => {
    t.dropColumn('last_alteration_at')
    t.dropColumn('payout_needs_review')
  })
}
