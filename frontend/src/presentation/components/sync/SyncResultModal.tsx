import type { SyncResult } from '@/domain/entities/sync'

function EmptySyncList({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-stone-200 py-8 text-stone-300 dark:border-stone-700 dark:text-stone-500">
      <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  )
}

export default function SyncResultModal({
  result,
  isClosing,
  onClose,
}: {
  result: SyncResult
  isClosing: boolean
  onClose: () => void
}) {
  return (
    <div
      className={`sync-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4 py-6 ${
        isClosing ? 'sync-modal-overlay-exit' : 'sync-modal-overlay-enter'
      }`}
      onClick={onClose}
    >
      <div
        className={`sync-modal-panel max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-stone-900 ${
          isClosing ? 'sync-modal-panel-exit' : 'sync-modal-panel-enter'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Detalhes da sincronização
            </h2>
            <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
              {result.imported} importada(s) · {result.skipped} ignorada(s) ·{' '}
              {result.errors.length} erro(s)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label="Fechar modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(86vh-82px)] overflow-y-auto px-5 py-5 space-y-6">
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Importadas
            </h3>
            {result.importedItems.length === 0 ? (
              <EmptySyncList label="Nenhuma reserva importada" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-100 dark:divide-stone-800 dark:border-stone-800">
                {result.importedItems.map((item) => (
                  <div key={item.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {item.guestName || item.subject || item.emailId}
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                      {item.confirmationCode
                        ? `Código ${item.confirmationCode}`
                        : item.emailId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Ignoradas
            </h3>
            {result.skippedItems.length === 0 ? (
              <EmptySyncList label="Nenhuma reserva ignorada" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-100 dark:divide-stone-800 dark:border-stone-800">
                {result.skippedItems.map((item) => (
                  <div key={item.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {item.guestName || item.subject || item.emailId}
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                      {item.reason || 'Ignorada'} · {item.emailId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Erros
            </h3>
            {result.errors.length === 0 ? (
              <EmptySyncList label="Nenhum erro encontrado" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-100 dark:divide-stone-800 dark:border-stone-800">
                {result.errors.map((error) => (
                  <div key={error.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {error.emailId}
                    </p>
                    <p className="text-xs text-rose-500 mt-1">{error.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
