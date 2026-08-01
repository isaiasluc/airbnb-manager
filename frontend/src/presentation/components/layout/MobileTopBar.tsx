import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from '@/presentation/shared/ThemeToggle'
import { buttonSignOut } from '@/presentation/shared/buttonStyles'
import { NAV_ITEMS, SIGN_OUT_ICON_PATH } from './navItems'

export default function MobileTopBar({ onSignOut }: { onSignOut: () => void }) {
  const { pathname } = useLocation()

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-line bg-surface px-2 transition-colors md:hidden dark:border-line-dark dark:bg-surface-dark">
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
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

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sair"
          title="Sair"
          className={`${buttonSignOut} !w-9 !px-0`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d={SIGN_OUT_ICON_PATH} />
          </svg>
        </button>
      </div>
    </header>
  )
}
