import { useState, type ReactNode } from 'react'

const CLOSE_ANIMATION_MS = 180

export default function Modal({
  title,
  onClose,
  children,
  maxWidthClassName = 'max-w-md',
}: {
  title: string
  onClose: () => void
  children: ReactNode | ((requestClose: () => void) => ReactNode)
  maxWidthClassName?: string
}) {
  const [closing, setClosing] = useState(false)

  function requestClose() {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, CLOSE_ANIMATION_MS)
  }

  return (
    <div
      className={`sync-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 dark:bg-black/60 ${
        closing ? 'sync-modal-overlay-exit' : 'sync-modal-overlay-enter'
      }`}
      onClick={requestClose}
    >
      <div
        className={`sync-modal-panel w-full ${maxWidthClassName} overflow-hidden rounded-xl bg-surface shadow-xl dark:bg-surface-dark ${
          closing ? 'sync-modal-panel-exit' : 'sync-modal-panel-enter'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-line-dark">
          <h2 className="font-display text-base font-semibold text-ink dark:text-ink-dark">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            className="rounded-full p-2 text-ink-muted transition-colors hover:bg-paper hover:text-ink dark:text-ink-muted-dark dark:hover:bg-paper-dark dark:hover:text-ink-dark"
            aria-label="Fechar"
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

        {typeof children === 'function' ? children(requestClose) : children}
      </div>
    </div>
  )
}
