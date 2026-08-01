export interface Expense {
  id: number
  description: string
  category: 'despesas' | 'reparos' | 'limpeza' | 'compras'
  amount: number
  expense_date: string
  status: 'paid' | 'pending'
  paid_at: string | null
  created_at: string
  updated_at: string
}

export type ExpenseCategory = Expense['category']
export type ExpenseStatus = Expense['status']

export interface MonthlyExpenseSummary {
  month: string
  total: number
  byCategory: Record<ExpenseCategory, number>
}

export type CreateExpenseInput = {
  description: string
  category: ExpenseCategory
  amount: number
  expense_date: string
  status?: ExpenseStatus
  paid_at?: string | null
}
