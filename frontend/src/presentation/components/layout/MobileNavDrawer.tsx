import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from '@/presentation/shared/ThemeToggle'
import { buttonSignOut, iconButton } from '@/presentation/shared/buttonStyles'
import { NAV_ITEMS } from './navItems'

const CLOSE_ANIMATION_MS = 200

export default function MobileNavDrawer({
  onClose,
  onSignOut,
}: {
  onClose: () => void
  onSignOut: () => void
}) {
  const { pathname } = useLocation()
  const [closing, setClosing] = useState(false)

  function requestClose() {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, CLOSE_ANIMATION_MS)
  }

  return (
    <div
      className={`fixed inset-0 z-40 bg-ink/40 md:hidden dark:bg-black/60 ${
        closing ? 'drawer-overlay-exit' : 'drawer-overlay-enter'
      }`}
      onClick={requestClose}
    >
      <div
        className={`flex h-full w-72 max-w-[80vw] flex-col border-r border-line bg-surface dark:border-line-dark dark:bg-surface-dark ${
          closing ? 'drawer-panel-exit' : 'drawer-panel-enter'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-5 pt-6 pb-5">
          <div className="min-w-0">
            <p className="font-display truncate text-lg font-semibold tracking-tight text-ink dark:text-ink-dark">
              Airbnb Manager
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-muted dark:text-ink-muted-dark">
              Apê dos sonhos em Ponta Negra
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className={iconButton}
            aria-label="Fechar menu"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={requestClose}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent-soft text-accent dark:bg-accent-soft-dark dark:text-accent-dark'
                    : 'text-ink-muted hover:bg-paper hover:text-ink dark:text-ink-muted-dark dark:hover:bg-paper-dark dark:hover:text-ink-dark'
                }`}
              >
                <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-line p-3 dark:border-line-dark">
          <ThemeToggle />
          <button type="button" onClick={onSignOut} className={buttonSignOut}>
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
