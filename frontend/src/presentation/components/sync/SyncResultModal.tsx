import type { SyncItem, SyncResult } from '@/domain/entities/sync'

function EmptySyncList({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line py-8 text-ink-muted/70 dark:border-line-dark dark:text-ink-muted-dark/70">
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

function SyncSection({
  title,
  items,
  emptyLabel,
  detail,
}: {
  title: string
  items: SyncItem[]
  emptyLabel: string
  detail: (item: SyncItem) => string
}) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">
        {title}
      </h3>
      {items.length === 0 ? (
        <EmptySyncList label={emptyLabel} />
      ) : (
        <div className="divide-y divide-line rounded-lg border border-line dark:divide-line-dark dark:border-line-dark">
          {items.map((item) => (
            <div key={item.emailId} className="px-4 py-3">
              <p className="text-sm font-medium text-ink dark:text-ink-dark">
                {item.guestName || item.subject || item.emailId}
              </p>
              <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
                {detail(item)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
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
      className={`sync-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 dark:bg-black/60 ${
        isClosing ? 'sync-modal-overlay-exit' : 'sync-modal-overlay-enter'
      }`}
      onClick={onClose}
    >
      <div
        className={`sync-modal-panel max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-xl bg-surface shadow-xl dark:bg-surface-dark ${
          isClosing ? 'sync-modal-panel-exit' : 'sync-modal-panel-enter'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-line-dark">
          <div>
            <h2 className="font-display text-base font-semibold text-ink dark:text-ink-dark">
              Detalhes da sincronização
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-muted-dark">
              {result.imported} importada(s) · {result.cancelled} cancelada(s) ·{' '}
              {result.skipped} ignorada(s) · {result.errors.length} erro(s)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-muted transition-colors hover:bg-paper hover:text-ink dark:text-ink-muted-dark dark:hover:bg-paper-dark dark:hover:text-ink-dark"
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
          <SyncSection
            title="Importadas"
            items={result.importedItems}
            emptyLabel="Nenhuma reserva importada"
            detail={(item) =>
              item.confirmationCode ? `Código ${item.confirmationCode}` : item.emailId
            }
          />

          <SyncSection
            title="Canceladas"
            items={result.cancelledItems}
            emptyLabel="Nenhuma reserva cancelada"
            detail={(item) =>
              item.confirmationCode ? `Código ${item.confirmationCode}` : item.emailId
            }
          />

          <SyncSection
            title="Ignoradas"
            items={result.skippedItems}
            emptyLabel="Nenhuma reserva ignorada"
            detail={(item) => `${item.reason || 'Ignorada'} · ${item.emailId}`}
          />

          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">
              Erros
            </h3>
            {result.errors.length === 0 ? (
              <EmptySyncList label="Nenhum erro encontrado" />
            ) : (
              <div className="divide-y divide-line rounded-lg border border-line dark:divide-line-dark dark:border-line-dark">
                {result.errors.map((error) => (
                  <div key={error.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-ink dark:text-ink-dark">
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
