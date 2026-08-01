export const statusLabel: Record<string, string> = {
  confirmed: 'Confirmada',
  in_progress: 'Em andamento',
  cancelled: 'Cancelada',
  completed: 'Concluída',
}

export const statusColor: Record<string, string> = {
  confirmed:
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800',
  in_progress:
    'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800',
  cancelled:
    'bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800',
  completed:
    'bg-ink-muted/10 text-ink-muted ring-line dark:bg-ink-muted-dark/15 dark:text-ink-muted-dark dark:ring-line-dark',
}

export const hostServiceStatusLabel: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  cancelled: 'Cancelado',
}

export const hostServiceStatusColor: Record<string, string> = {
  pending:
    'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800',
  cancelled:
    'bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800',
}
