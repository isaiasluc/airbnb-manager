import type { MonthlyExpenseSummary } from '@/domain/entities/expense'
import { formatCurrency } from '@/presentation/shared/format'
import { categoryLabel, categoryOptions } from './expensePresentation'

export default function ExpensesSummaryCards({
  summary,
}: {
  summary: MonthlyExpenseSummary[]
}) {
  const total = summary.reduce((sum, month) => sum + month.total, 0)
  const byCategory = categoryOptions.map((category) => ({
    category,
    total: summary.reduce((sum, month) => sum + month.byCategory[category], 0),
  }))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div className="rounded-xl border border-stone-200 bg-white px-5 py-4 transition-colors dark:border-stone-800 dark:bg-stone-900">
        <p className="mb-1 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
          Total no período
        </p>
        <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
          {formatCurrency(total)}
        </p>
      </div>
      {byCategory.map(({ category, total: categoryTotal }) => (
        <div
          key={category}
          className="rounded-xl border border-stone-200 bg-white px-5 py-4 transition-colors dark:border-stone-800 dark:bg-stone-900"
        >
          <p className="mb-1 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
            {categoryLabel[category]}
          </p>
          <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {formatCurrency(categoryTotal)}
          </p>
        </div>
      ))}
    </div>
  )
}
