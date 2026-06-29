import type { Knex } from 'knex'

async function getStatusConstraintName(knex: Knex): Promise<string | undefined> {
  const result = await knex.raw(`
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'reservations'
      AND a.attname = 'status'
      AND c.contype = 'c'
    LIMIT 1
  `)

  return result.rows?.[0]?.conname
}

export async function up(knex: Knex): Promise<void> {
  const constraintName = await getStatusConstraintName(knex)

  if (constraintName) {
    await knex.schema.alterTable('reservations', (t) => {
      t.dropChecks([constraintName])
    })
  }

  await knex.schema.alterTable('reservations', (t) => {
    t.check(
      "status IN ('confirmed', 'cancelled', 'completed', 'in_progress')",
      [],
      'reservations_status_check'
    )
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex('reservations')
    .where({ status: 'in_progress' })
    .update({ status: 'confirmed' })

  const constraintName = await getStatusConstraintName(knex)

  if (constraintName) {
    await knex.schema.alterTable('reservations', (t) => {
      t.dropChecks([constraintName])
    })
  }

  await knex.schema.alterTable('reservations', (t) => {
    t.check(
      "status IN ('confirmed', 'cancelled', 'completed')",
      [],
      'reservations_status_check'
    )
  })
}
