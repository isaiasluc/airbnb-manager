import type { ReactNode } from 'react'

export default function Modal({
  title,
  onClose,
  children,
  maxWidthClassName = 'max-w-md',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
}) {
  return (
    <div
      className="sync-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4 py-6 sync-modal-overlay-enter"
      onClick={onClose}
    >
      <div
        className={`sync-modal-panel w-full ${maxWidthClassName} overflow-hidden rounded-xl bg-white shadow-xl dark:bg-stone-900 sync-modal-panel-enter`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
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

        {children}
      </div>
    </div>
  )
}
