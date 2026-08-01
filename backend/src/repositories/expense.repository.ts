import db from '../db'
import type { Expense, ExpenseListFilters } from '../types'

export async function listExpenses(filters: ExpenseListFilters = {}): Promise<Expense[]> {
  const query = db<Expense>('expenses')

  if (filters.from) {
    query.where('expense_date', '>=', filters.from)
  }

  if (filters.to) {
    query.where('expense_date', '<=', filters.to)
  }

  if (filters.category) {
    query.where('category', filters.category)
  }

  if (filters.status) {
    query.where('status', filters.status)
  }

  return query.orderBy('expense_date', 'desc')
}

export async function findExpenseById(id: number): Promise<Expense | undefined> {
  return db<Expense>('expenses').where({ id }).first()
}

type ExpenseDateFields = { expense_date: string; paid_at: string | null }

export async function createExpense(
  data: Omit<Expense, 'id' | 'created_at' | 'updated_at' | keyof ExpenseDateFields> & ExpenseDateFields
): Promise<Expense> {
  const [created] = await db('expenses').insert(data).returning('*')
  return created
}

export async function updateExpense(
  id: number,
  data: Partial<
    Pick<Expense, 'description' | 'category' | 'amount' | 'status'> & ExpenseDateFields
  >
): Promise<Expense | undefined> {
  const [updated] = await db('expenses').where({ id }).update(data).returning('*')
  return updated
}

export async function deleteExpense(id: number): Promise<boolean> {
  const count = await db('expenses').where({ id }).delete()
  return count > 0
}
