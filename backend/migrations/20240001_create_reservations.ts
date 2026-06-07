import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('guests', (t) => {
    t.increments('id').primary()
    t.string('first_name', 100).notNullable()
    t.string('last_name', 100).notNullable()
    t.timestamps(true, true)
  })

  await knex.schema.createTable('reservations', (t) => {
    t.increments('id').primary()
    t.string('confirmation_code', 20).notNullable().unique()
    t.integer('guest_id').notNullable().references('id').inTable('guests').onDelete('RESTRICT')
    t.string('listing_name', 255).notNullable()
    t.timestamp('checkin_at', { useTz: true }).notNullable()
    t.timestamp('checkout_at', { useTz: true }).notNullable()
    t.smallint('guests_count').notNullable().defaultTo(1)
    t.decimal('host_payout', 10, 2).notNullable()
    t.string('currency', 3).notNullable().defaultTo('BRL')
    t.string('source_email_id', 255).notNullable().unique()
    t.enum('status', ['confirmed', 'cancelled', 'completed']).notNullable().defaultTo('confirmed')
    t.timestamps(true, true)
  })

  await knex.raw('CREATE INDEX idx_reservations_checkin  ON reservations (checkin_at)')
  await knex.raw('CREATE INDEX idx_reservations_checkout ON reservations (checkout_at)')
  await knex.raw('CREATE INDEX idx_reservations_status   ON reservations (status)')
  await knex.raw('CREATE INDEX idx_reservations_guest    ON reservations (guest_id)')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reservations')
  await knex.schema.dropTableIfExists('guests')
}
