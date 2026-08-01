import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/application/auth/useAuth'
import { useExpenses } from '@/application/expenses/useExpenses'
import type { CreateExpenseInput, Expense, ExpenseCategory } from '@/domain/entities/expense'
import { createExpense, deleteExpense, updateExpense } from '@/infrastructure/expenses/expenseApi'
import { getCurrentMonthRange } from '@/presentation/shared/dateRanges'
import ThemeToggle from '@/presentation/shared/ThemeToggle'
import ExpensesSummaryCards from '@/presentation/components/expenses/ExpensesSummaryCards'
import ExpensesTable from '@/presentation/components/expenses/ExpensesTable'
import ExpenseFormModal from '@/presentation/components/expenses/ExpenseFormModal'
import DeleteExpenseModal from '@/presentation/components/expenses/DeleteExpenseModal'
import { categoryLabel, categoryOptions } from '@/presentation/components/expenses/expensePresentation'

const FILTER_BUTTON_CLASS =
  'h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500'

const DATE_INPUT_CLASS =
  'h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-normal text-stone-700 outline-none transition-colors focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:focus:border-stone-500'

export default function Expenses() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [{ from, to }, setRange] = useState(getCurrentMonthRange())
  const [category, setCategory] = useState<ExpenseCategory | ''>('')

  const { expenses, summary, loading, reload } = useExpenses({
    from,
    to,
    category: category || undefined,
  })

  const [modalExpense, setModalExpense] = useState<Expense | null | 'new'>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(data: CreateExpenseInput) {
    setSaving(true)
    setFormError(null)
    try {
      if (modalExpense && modalExpense !== 'new') {
        await updateExpense(modalExpense.id, data)
      } else {
        await createExpense(data)
      }
      await reload()
      setModalExpense(null)
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deletingExpense) return
    setDeleting(true)
    try {
      await deleteExpense(deletingExpense.id)
      await reload()
      setDeletingExpense(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans transition-colors dark:bg-stone-950">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-950">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
              aria-label="Voltar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-stone-900 tracking-tight dark:text-stone-100">
                Despesas
              </h1>
              <p className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">
                Gastos mensais do apê
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className={DATE_INPUT_CLASS}
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className={DATE_INPUT_CLASS}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory | '')}
              className={DATE_INPUT_CLASS}
            >
              <option value="">Todas as categorias</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel[c]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setRange(getCurrentMonthRange())}
              className={FILTER_BUTTON_CLASS}
            >
              Este mês
            </button>
            <ThemeToggle />
            <button type="button" onClick={() => void signOut()} className={FILTER_BUTTON_CLASS}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <ExpensesSummaryCards summary={summary} />

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setModalExpense('new')}
            className="h-9 rounded-lg bg-stone-900 px-3 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-300"
          >
            Nova despesa
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-stone-300 dark:text-stone-600">
            Carregando...
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-stone-300 dark:text-stone-600">
            <span className="text-sm">Nenhuma despesa encontrada</span>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-900">
            <ExpensesTable
              expenses={expenses}
              onEdit={(expense) => setModalExpense(expense)}
              onDelete={(expense) => setDeletingExpense(expense)}
            />
          </div>
        )}
      </main>

      {modalExpense && (
        <ExpenseFormModal
          expense={modalExpense === 'new' ? null : modalExpense}
          saving={saving}
          error={formError}
          onSubmit={handleSubmit}
          onClose={() => {
            setModalExpense(null)
            setFormError(null)
          }}
        />
      )}

      {deletingExpense && (
        <DeleteExpenseModal
          expense={deletingExpense}
          deleting={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeletingExpense(null)}
        />
      )}
    </div>
  )
}
