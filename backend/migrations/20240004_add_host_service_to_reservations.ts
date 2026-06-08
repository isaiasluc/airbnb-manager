import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reservations', (t) => {
    t.decimal('host_service_fee', 10, 2).notNullable().defaultTo(0)
    t.enum('host_service_status', ['pending', 'paid']).notNullable().defaultTo('pending')
  })

  await knex.raw(`
    UPDATE reservations
    SET host_service_fee = ROUND(
      (
        host_payout *
        CASE
          WHEN checkin_at >= DATE '2026-02-08' THEN 0.12
          ELSE 0.10
        END
      )::numeric,
      2
    )
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reservations', (t) => {
    t.dropColumn('host_service_status')
    t.dropColumn('host_service_fee')
  })
}
