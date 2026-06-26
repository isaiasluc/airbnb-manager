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
    <div className="flex flex-col gap-3 border-t border-stone-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
      <p className="text-xs text-stone-400 dark:text-stone-500">
        Mostrando {showingStart}-{showingEnd} de {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-500 transition-colors hover:border-stone-400 disabled:opacity-40 disabled:hover:border-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500 dark:disabled:hover:border-stone-700"
        >
          Anterior
        </button>
        <span className="px-1 text-xs text-stone-400 dark:text-stone-500">
          Página {page} de {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-500 transition-colors hover:border-stone-400 disabled:opacity-40 disabled:hover:border-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500 dark:disabled:hover:border-stone-700"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
