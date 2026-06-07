import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reservations', (t) => {
    t.boolean('email_sent').notNullable().defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reservations', (t) => {
    t.dropColumn('email_sent')
  })
}
