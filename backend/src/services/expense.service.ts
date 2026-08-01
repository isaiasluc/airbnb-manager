import * as ExpenseRepo from '../repositories/expense.repository'
import type { CreateExpenseInput, Expense, ExpenseListFilters, MonthlyExpenseSummary } from '../types'

const EXPENSE_CATEGORIES: Expense['category'][] = ['despesas', 'reparos', 'limpeza', 'compras']

function formatDateOnly(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10)
}

function validateExpenseInput(input: Pick<CreateExpenseInput, 'description' | 'category' | 'amount'>): void {
  if (!input.description || !input.description.trim()) {
    throw new Error('Descrição é obrigatória')
  }

  if (!EXPENSE_CATEGORIES.includes(input.category)) {
    throw new Error(`Categoria inválida: ${input.category}`)
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Valor deve ser maior que zero')
  }
}

export function summarizeExpensesByMonth(
  expenses: Pick<Expense, 'amount' | 'expense_date' | 'category'>[]
): MonthlyExpenseSummary[] {
  const map = new Map<string, MonthlyExpenseSummary>()

  for (const expense of expenses) {
    const month = formatDateOnly(expense.expense_date).slice(0, 7)
    let summary = map.get(month)
    if (!summary) {
      summary = {
        month,
        total: 0,
        byCategory: { despesas: 0, reparos: 0, limpeza: 0, compras: 0 },
      }
      map.set(month, summary)
    }

    const amount = Number(expense.amount)
    summary.total = Math.round((summary.total + amount) * 100) / 100
    summary.byCategory[expense.category] = Math.round(
      (summary.byCategory[expense.category] + amount) * 100
    ) / 100
  }

  return [...map.values()].sort((a, b) => b.month.localeCompare(a.month))
}

export async function listExpenses(filters: ExpenseListFilters = {}): Promise<Expense[]> {
  return ExpenseRepo.listExpenses(filters)
}

export async function getMonthlySummary(
  filters: ExpenseListFilters = {}
): Promise<MonthlyExpenseSummary[]> {
  const expenses = await ExpenseRepo.listExpenses(filters)
  return summarizeExpensesByMonth(expenses)
}

export async function getExpense(id: number): Promise<Expense> {
  const expense = await ExpenseRepo.findExpenseById(id)
  if (!expense) throw new Error(`Despesa ${id} não encontrada`)
  return expense
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  validateExpenseInput(input)

  return ExpenseRepo.createExpense({
    description: input.description.trim(),
    category: input.category,
    amount: input.amount,
    expense_date: formatDateOnly(input.expense_date),
    status: input.status ?? 'pending',
    paid_at: input.paid_at ? formatDateOnly(input.paid_at) : null,
  })
}

export async function updateExpense(
  id: number,
  data: Parameters<typeof ExpenseRepo.updateExpense>[1]
): Promise<Expense> {
  if (data.description !== undefined || data.category !== undefined || data.amount !== undefined) {
    const current = await getExpense(id)
    validateExpenseInput({
      description: data.description ?? current.description,
      category: data.category ?? current.category,
      amount: data.amount !== undefined ? Number(data.amount) : Number(current.amount),
    })
  }

  const updated = await ExpenseRepo.updateExpense(id, data)
  if (!updated) throw new Error(`Despesa ${id} não encontrada`)
  return updated
}

export async function deleteExpense(id: number): Promise<void> {
  const deleted = await ExpenseRepo.deleteExpense(id)
  if (!deleted) throw new Error(`Despesa ${id} não encontrada`)
}
