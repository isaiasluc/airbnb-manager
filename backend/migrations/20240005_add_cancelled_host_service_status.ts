import type { Knex } from 'knex'

async function getHostServiceStatusConstraintName(knex: Knex): Promise<string | undefined> {
  const result = await knex.raw(`
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'reservations'
      AND a.attname = 'host_service_status'
      AND c.contype = 'c'
    LIMIT 1
  `)

  return result.rows?.[0]?.conname
}

export async function up(knex: Knex): Promise<void> {
  const constraintName = await getHostServiceStatusConstraintName(knex)

  if (constraintName) {
    await knex.schema.alterTable('reservations', (t) => {
      t.dropChecks([constraintName])
    })
  }

  await knex.schema.alterTable('reservations', (t) => {
    t.check(
      "host_service_status IN ('pending', 'paid', 'cancelled')",
      [],
      'reservations_host_service_status_check'
    )
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex('reservations')
    .where({ host_service_status: 'cancelled' })
    .update({ host_service_status: 'pending' })

  const constraintName = await getHostServiceStatusConstraintName(knex)

  if (constraintName) {
    await knex.schema.alterTable('reservations', (t) => {
      t.dropChecks([constraintName])
    })
  }

  await knex.schema.alterTable('reservations', (t) => {
    t.check(
      "host_service_status IN ('pending', 'paid')",
      [],
      'reservations_host_service_status_check'
    )
  })
}
