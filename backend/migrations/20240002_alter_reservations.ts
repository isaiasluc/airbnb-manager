import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reservations', (t) => {
    t.dropColumn('listing_name')
  })

  // Converte TIMESTAMPTZ para DATE (descarta a parte de hora)
  await knex.raw(`
    ALTER TABLE reservations
      ALTER COLUMN checkin_at  TYPE DATE USING checkin_at::DATE,
      ALTER COLUMN checkout_at TYPE DATE USING checkout_at::DATE
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reservations', (t) => {
    t.string('listing_name', 255).notNullable().defaultTo('')
  })

  await knex.raw(`
    ALTER TABLE reservations
      ALTER COLUMN checkin_at  TYPE TIMESTAMPTZ USING checkin_at::TIMESTAMPTZ,
      ALTER COLUMN checkout_at TYPE TIMESTAMPTZ USING checkout_at::TIMESTAMPTZ
  `)
}
