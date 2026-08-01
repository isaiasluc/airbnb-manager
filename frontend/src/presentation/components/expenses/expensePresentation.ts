import type { ExpenseCategory, ExpenseStatus } from '@/domain/entities/expense'

export const categoryLabel: Record<ExpenseCategory, string> = {
  despesas: 'Despesas',
  reparos: 'Reparos',
  limpeza: 'Limpeza',
  compras: 'Compras',
}

export const categoryOptions: ExpenseCategory[] = ['despesas', 'reparos', 'limpeza', 'compras']

export const statusLabel: Record<ExpenseStatus, string> = {
  paid: 'Pago',
  pending: 'Aguardando pagamento',
}

export const statusColor: Record<ExpenseStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800',
  pending:
    'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800',
}
