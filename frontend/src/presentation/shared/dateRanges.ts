import { formatInputDate } from './format'

export function getCurrentMonthRange() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return {
    from: formatInputDate(start),
    to: formatInputDate(end),
  }
}

export function getNext30DaysRange() {
  const start = new Date()
  const end = new Date(start)
  end.setDate(start.getDate() + 30)
  return {
    from: formatInputDate(start),
    to: formatInputDate(end),
  }
}
