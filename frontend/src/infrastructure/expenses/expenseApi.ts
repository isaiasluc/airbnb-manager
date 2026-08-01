import type {
  CreateExpenseInput,
  Expense,
  MonthlyExpenseSummary,
} from '@/domain/entities/expense'
import { authFetch, BASE, buildQuery } from '../http/apiClient'

export interface ExpenseListFilters {
  from?: string
  to?: string
  category?: Expense['category']
  status?: Expense['status']
}

export async function fetchExpenses(filters: ExpenseListFilters = {}): Promise<Expense[]> {
  const query = buildQuery({
    from: filters.from,
    to: filters.to,
    category: filters.category,
    status: filters.status,
  })
  const res = await authFetch(`${BASE}/expenses${query}`)
  if (!res.ok) throw new Error('Erro ao buscar despesas')
  return res.json()
}

export async function fetchExpensesSummary(
  filters: ExpenseListFilters = {},
): Promise<MonthlyExpenseSummary[]> {
  const query = buildQuery({
    from: filters.from,
    to: filters.to,
    category: filters.category,
    status: filters.status,
  })
  const res = await authFetch(`${BASE}/expenses/summary${query}`)
  if (!res.ok) throw new Error('Erro ao buscar resumo de despesas')
  return res.json()
}

export async function createExpense(data: CreateExpenseInput): Promise<Expense> {
  const res = await authFetch(`${BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Erro ao criar despesa')
  }
  return res.json()
}

export async function updateExpense(
  id: number,
  data: Partial<CreateExpenseInput>,
): Promise<Expense> {
  const res = await authFetch(`${BASE}/expenses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Erro ao atualizar despesa')
  }
  return res.json()
}

export async function deleteExpense(id: number): Promise<void> {
  const res = await authFetch(`${BASE}/expenses/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erro ao deletar despesa')
}
