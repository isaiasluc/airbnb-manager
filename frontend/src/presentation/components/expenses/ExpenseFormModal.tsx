import { useState } from 'react'
import type { CreateExpenseInput, Expense, ExpenseStatus } from '@/domain/entities/expense'
import Modal from '@/presentation/shared/Modal'
import { categoryLabel, categoryOptions, statusLabel } from './expensePresentation'

const STATUS_OPTIONS: ExpenseStatus[] = ['pending', 'paid']

const INPUT_CLASS =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition-colors focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:focus:border-stone-500'

const LABEL_CLASS =
  'mb-1.5 block text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500'

function toFormState(expense: Expense | null): CreateExpenseInput {
  if (!expense) {
    return {
      description: '',
      category: 'despesas',
      amount: 0,
      expense_date: new Date().toISOString().slice(0, 10),
      status: 'pending',
      paid_at: null,
    }
  }
  return {
    description: expense.description,
    category: expense.category,
    amount: Number(expense.amount),
    expense_date: expense.expense_date.slice(0, 10),
    status: expense.status,
    paid_at: expense.paid_at ? expense.paid_at.slice(0, 10) : null,
  }
}

export default function ExpenseFormModal({
  expense,
  saving,
  error,
  onSubmit,
  onClose,
}: {
  expense: Expense | null
  saving: boolean
  error: string | null
  onSubmit: (data: CreateExpenseInput) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<CreateExpenseInput>(() => toFormState(expense))

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit({
      ...form,
      paid_at: form.status === 'paid' ? (form.paid_at ?? form.expense_date) : null,
    })
  }

  return (
    <Modal title={expense ? 'Editar despesa' : 'Nova despesa'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div>
          <label className={LABEL_CLASS}>Descrição</label>
          <input
            type="text"
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={INPUT_CLASS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Categoria</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as CreateExpenseInput['category'] }))
              }
              className={INPUT_CLASS}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel[category]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Valor (R$)</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.amount || ''}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Data</label>
          <input
            type="date"
            required
            value={form.expense_date}
            onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Status</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status }))}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ring-1 transition-colors ${
                  form.status === status
                    ? 'bg-stone-900 text-white ring-stone-900 dark:bg-stone-100 dark:text-stone-950 dark:ring-stone-100'
                    : 'bg-white text-stone-500 ring-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800'
                }`}
              >
                {statusLabel[status]}
              </button>
            ))}
          </div>
        </div>

        {form.status === 'paid' && (
          <div>
            <label className={LABEL_CLASS}>Pago em</label>
            <input
              type="date"
              value={form.paid_at ?? form.expense_date}
              onChange={(e) => setForm((f) => ({ ...f, paid_at: e.target.value }))}
              className={INPUT_CLASS}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-300"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
