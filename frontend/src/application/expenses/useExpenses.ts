import { useCallback, useEffect, useState } from 'react'
import type { Expense, MonthlyExpenseSummary } from '@/domain/entities/expense'
import {
  fetchExpenses,
  fetchExpensesSummary,
  type ExpenseListFilters,
} from '@/infrastructure/expenses/expenseApi'

export function useExpenses(filters: ExpenseListFilters) {
  const { from, to, category, status } = filters
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<MonthlyExpenseSummary[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const activeFilters = { from, to, category, status }
    const [data, summaryData] = await Promise.all([
      fetchExpenses(activeFilters),
      fetchExpensesSummary(activeFilters),
    ])
    setExpenses(data)
    setSummary(summaryData)
    return data
  }, [from, to, category, status])

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      try {
        const activeFilters = { from, to, category, status }
        const [data, summaryData] = await Promise.all([
          fetchExpenses(activeFilters),
          fetchExpensesSummary(activeFilters),
        ])
        if (isMounted) {
          setExpenses(data)
          setSummary(summaryData)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [from, to, category, status])

  return { expenses, summary, loading, reload }
}
