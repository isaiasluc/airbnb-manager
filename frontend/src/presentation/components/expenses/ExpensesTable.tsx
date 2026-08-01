import type { Expense } from '@/domain/entities/expense'
import { buttonGhost } from '@/presentation/shared/buttonStyles'
import { formatCurrency, formatDate } from '@/presentation/shared/format'
import { categoryLabel, statusColor, statusLabel } from './expensePresentation'

const COLUMNS = ['Data', 'Descrição', 'Categoria', 'Valor', 'Status', '']

export default function ExpensesTable({
  expenses,
  onEdit,
  onDelete,
}: {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-line dark:border-line-dark">
            {COLUMNS.map((column) => (
              <th
                key={column}
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60 dark:divide-line-dark/60">
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              className="group transition-colors hover:bg-accent-soft/50 dark:hover:bg-accent-soft-dark/40"
            >
              <td className="px-5 py-3.5 text-ink-muted dark:text-ink-muted-dark">
                {formatDate(expense.expense_date)}
              </td>
              <td className="px-5 py-3.5 font-medium text-ink dark:text-ink-dark">
                {expense.description}
              </td>
              <td className="px-5 py-3.5 text-ink-muted dark:text-ink-muted-dark">
                {categoryLabel[expense.category]}
              </td>
              <td className="px-5 py-3.5 font-medium tabular-nums text-ink dark:text-ink-dark">
                {formatCurrency(Number(expense.amount))}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${statusColor[expense.status]}`}
                >
                  {statusLabel[expense.status]}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex justify-end gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => onEdit(expense)} className={buttonGhost}>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(expense)}
                    className="text-xs font-medium text-red-400 transition-colors hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
