import type { Expense } from '@/domain/entities/expense'
import Modal from '@/presentation/shared/Modal'
import { formatCurrency, formatDate } from '@/presentation/shared/format'

export default function DeleteExpenseModal({
  expense,
  deleting,
  onConfirm,
  onClose,
}: {
  expense: Expense
  deleting: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal title="Remover despesa" onClose={onClose}>
      <div className="px-5 py-5">
        <p className="text-sm text-stone-600 dark:text-stone-300">
          Tem certeza que deseja remover a despesa abaixo? Essa ação não pode ser desfeita.
        </p>

        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {expense.description}
          </p>
          <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
            {formatDate(expense.expense_date)} · {formatCurrency(Number(expense.amount))}
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {deleting ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
