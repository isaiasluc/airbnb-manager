import type { Request, Response } from 'express'
import * as ExpenseService from '../services/expense.service'
import type { Expense, ExpenseListFilters } from '../types'

const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const EXPENSE_CATEGORIES: Expense['category'][] = ['despesas', 'reparos', 'limpeza', 'compras']
const EXPENSE_STATUSES: Expense['status'][] = ['paid', 'pending']

function getDateParam(value: unknown): string | undefined {
  return typeof value === 'string' && DATE_PARAM_PATTERN.test(value) ? value : undefined
}

function getCategoryParam(value: unknown): Expense['category'] | undefined {
  return typeof value === 'string' && EXPENSE_CATEGORIES.includes(value as Expense['category'])
    ? (value as Expense['category'])
    : undefined
}

function getStatusParam(value: unknown): Expense['status'] | undefined {
  return typeof value === 'string' && EXPENSE_STATUSES.includes(value as Expense['status'])
    ? (value as Expense['status'])
    : undefined
}

function getListFilters(query: Request['query']): ExpenseListFilters {
  return {
    from: getDateParam(query.from),
    to: getDateParam(query.to),
    category: getCategoryParam(query.category),
    status: getStatusParam(query.status),
  }
}

export async function list(req: Request, res: Response) {
  try {
    const filters = getListFilters(req.query)
    const expenses = await ExpenseService.listExpenses(filters)
    res.json(expenses)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function summary(req: Request, res: Response) {
  try {
    const filters = getListFilters(req.query)
    const monthlySummary = await ExpenseService.getMonthlySummary(filters)
    res.json(monthlySummary)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const expense = await ExpenseService.getExpense(Number(req.params.id))
    res.json(expense)
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const expense = await ExpenseService.createExpense(req.body)
    res.status(201).json(expense)
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const expense = await ExpenseService.updateExpense(Number(req.params.id), req.body)
    res.json(expense)
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await ExpenseService.deleteExpense(Number(req.params.id))
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
}
