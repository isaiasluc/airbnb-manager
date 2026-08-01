import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('expenses', (t) => {
    t.increments('id').primary()
    t.string('description', 500).notNullable()
    t.enum('category', ['despesas', 'reparos', 'limpeza', 'compras']).notNullable()
    t.decimal('amount', 10, 2).notNullable()
    t.date('expense_date').notNullable()
    t.enum('status', ['paid', 'pending']).notNullable().defaultTo('pending')
    t.date('paid_at').nullable()
    t.timestamps(true, true)
  })

  await knex.raw('CREATE INDEX idx_expenses_date     ON expenses (expense_date)')
  await knex.raw('CREATE INDEX idx_expenses_category ON expenses (category)')
  await knex.raw('CREATE INDEX idx_expenses_status   ON expenses (status)')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('expenses')
}
