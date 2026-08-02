import { useLocation } from 'react-router-dom'
import { iconButton } from '@/presentation/shared/buttonStyles'
import { NAV_ITEMS } from './navItems'

export default function MobileTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { pathname } = useLocation()
  const activeLabel = NAV_ITEMS.find((item) => item.isActive(pathname))?.label ?? 'Airbnb Manager'

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-3 transition-colors md:hidden dark:border-line-dark dark:bg-surface-dark">
      <button
        type="button"
        onClick={onOpenMenu}
        className={iconButton}
        aria-label="Abrir menu"
        title="Abrir menu"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>
      <p className="font-display truncate text-base font-semibold text-ink dark:text-ink-dark">
        {activeLabel}
      </p>
    </header>
  )
}
