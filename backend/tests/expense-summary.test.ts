import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeExpensesByMonth } from '../src/services/expense.service'
import type { Expense } from '../src/types'

type TestExpense = Pick<Expense, 'amount' | 'expense_date' | 'category'>

function expense(amount: number, expense_date: string, category: Expense['category']): TestExpense {
  return { amount, expense_date: new Date(`${expense_date}T00:00:00.000Z`), category }
}

test('groups expenses by month and sums totals', () => {
  const summary = summarizeExpensesByMonth([
    expense(100, '2026-06-05', 'limpeza'),
    expense(50, '2026-06-20', 'reparos'),
    expense(30, '2026-07-01', 'compras'),
  ])

  assert.equal(summary.length, 2)
  assert.deepEqual(summary[0], {
    month: '2026-07',
    total: 30,
    byCategory: { despesas: 0, reparos: 0, limpeza: 0, compras: 30 },
  })
  assert.deepEqual(summary[1], {
    month: '2026-06',
    total: 150,
    byCategory: { despesas: 0, reparos: 50, limpeza: 100, compras: 0 },
  })
})

test('returns empty array for no expenses', () => {
  assert.deepEqual(summarizeExpensesByMonth([]), [])
})

test('rounds accumulated totals to two decimals', () => {
  const summary = summarizeExpensesByMonth([
    expense(10.1, '2026-06-01', 'despesas'),
    expense(20.2, '2026-06-02', 'despesas'),
  ])

  assert.equal(summary[0].total, 30.3)
  assert.equal(summary[0].byCategory.despesas, 30.3)
})
