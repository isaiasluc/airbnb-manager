import { useState } from 'react'
import { useAuth } from '@/application/auth/useAuth'
import { useExpenses } from '@/application/expenses/useExpenses'
import type { CreateExpenseInput, Expense, ExpenseCategory } from '@/domain/entities/expense'
import { createExpense, deleteExpense, updateExpense } from '@/infrastructure/expenses/expenseApi'
import { getCurrentMonthRange } from '@/presentation/shared/dateRanges'
import { buttonPrimary, inputClass } from '@/presentation/shared/buttonStyles'
import DateRangePicker, { type DateRangePreset } from '@/presentation/shared/DateRangePicker'
import AppShell from '@/presentation/components/layout/AppShell'
import ExpensesSummaryCards from '@/presentation/components/expenses/ExpensesSummaryCards'
import ExpensesTable from '@/presentation/components/expenses/ExpensesTable'
import ExpenseFormModal from '@/presentation/components/expenses/ExpenseFormModal'
import DeleteExpenseModal from '@/presentation/components/expenses/DeleteExpenseModal'
import { categoryLabel, categoryOptions } from '@/presentation/components/expenses/expensePresentation'

export default function Expenses() {
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

  const datePresets: DateRangePreset[] = [
    { key: 'month', label: 'Este mês', ...getCurrentMonthRange() },
  ]

  return (
    <AppShell onSignOut={() => void signOut()}>
      <header className="sticky top-14 z-10 border-b border-line bg-surface transition-colors md:top-0 dark:border-line-dark dark:bg-surface-dark">
        <div className="max-w-6xl mx-auto px-6 pt-5 pb-3">
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-ink-dark">
            Despesas
          </h1>
        </div>

        <div className="border-t border-line bg-paper/60 dark:border-line-dark dark:bg-paper-dark/40">
          <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center gap-2">
            <DateRangePicker
              dateFrom={from}
              dateTo={to}
              presets={datePresets}
              onApply={(range) => setRange(range)}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory | '')}
              className={inputClass}
            >
              <option value="">Todas as categorias</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel[c]}
                </option>
              ))}
            </select>

            <div className="ml-auto">
              <button type="button" onClick={() => setModalExpense('new')} className={buttonPrimary}>
                Nova despesa
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <ExpensesSummaryCards summary={summary} />

        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-ink-muted/70 dark:text-ink-muted-dark/70">
            Carregando...
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-ink-muted/70 dark:text-ink-muted-dark/70">
            <span className="text-sm">Nenhuma despesa encontrada</span>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface transition-colors dark:border-line-dark dark:bg-surface-dark">
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
    </AppShell>
  )
}
