import type { Expense } from '@/domain/entities/expense'
import Modal from '@/presentation/shared/Modal'
import { buttonDanger, buttonSecondary } from '@/presentation/shared/buttonStyles'
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
      {(requestClose) => (
        <div className="px-5 py-5">
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
            Tem certeza que deseja remover a despesa abaixo? Essa ação não pode ser desfeita.
          </p>

          <div className="mt-4 rounded-lg border border-line bg-paper px-4 py-3 dark:border-line-dark dark:bg-paper-dark">
            <p className="text-sm font-medium text-ink dark:text-ink-dark">
              {expense.description}
            </p>
            <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
              {formatDate(expense.expense_date)} · {formatCurrency(Number(expense.amount))}
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={requestClose} className={buttonSecondary}>
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} disabled={deleting} className={buttonDanger}>
              {deleting ? 'Removendo...' : 'Remover'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
