import { buttonSecondary } from '@/presentation/shared/buttonStyles'

export default function Pagination({
  page,
  totalPages,
  showingStart,
  showingEnd,
  total,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  showingStart: number
  showingEnd: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-line-dark">
      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
        Mostrando {showingStart}-{showingEnd} de {total}
      </p>
      <div className="flex items-center gap-2">
        <button onClick={onPrev} disabled={page === 1} className={buttonSecondary}>
          Anterior
        </button>
        <span className="px-1 text-xs text-ink-muted dark:text-ink-muted-dark">
          Página {page} de {totalPages}
        </span>
        <button onClick={onNext} disabled={page === totalPages} className={buttonSecondary}>
          Próxima
        </button>
      </div>
    </div>
  )
}
