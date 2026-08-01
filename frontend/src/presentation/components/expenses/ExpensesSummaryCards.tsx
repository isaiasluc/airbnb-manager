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
      <div className="rounded-xl border border-t-2 border-line border-t-accent bg-surface px-5 py-4 transition-colors dark:border-line-dark dark:border-t-accent-dark dark:bg-surface-dark">
        <p className="mb-1 text-xs uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">
          Total no período
        </p>
        <p className="font-display text-2xl font-semibold tabular-nums text-accent dark:text-accent-dark">
          {formatCurrency(total)}
        </p>
      </div>
      {byCategory.map(({ category, total: categoryTotal }) => (
        <div
          key={category}
          className="rounded-xl border border-line bg-surface px-5 py-4 transition-colors dark:border-line-dark dark:bg-surface-dark"
        >
          <p className="mb-1 text-xs uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">
            {categoryLabel[category]}
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums text-ink dark:text-ink-dark">
            {formatCurrency(categoryTotal)}
          </p>
        </div>
      ))}
    </div>
  )
}
