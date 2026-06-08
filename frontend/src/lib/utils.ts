export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function guestName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(' ')
}

export function nightsCount(checkin: string, checkout: string): number {
  const a = new Date(checkin)
  const b = new Date(checkout)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export const statusLabel: Record<string, string> = {
  confirmed:  'Confirmada',
  cancelled:  'Cancelada',
  completed:  'Concluída',
}

export const statusColor: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800',
  cancelled: 'bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800',
  completed: 'bg-stone-100 text-stone-500 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700',
}

export const hostServiceStatusLabel: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  cancelled: 'Cancelado',
}

export const hostServiceStatusColor: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800',
  cancelled: 'bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800',
}
