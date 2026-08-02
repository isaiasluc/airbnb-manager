import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from '@/presentation/shared/ThemeToggle'
import { buttonSignOut, iconButton } from '@/presentation/shared/buttonStyles'
import { NAV_ITEMS, SIGN_OUT_ICON_PATH } from './navItems'

export const SIDEBAR_WIDTH_EXPANDED = 'w-60'
export const SIDEBAR_WIDTH_COLLAPSED = 'w-16'

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  onSignOut,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  onSignOut: () => void
}) {
  const { pathname } = useLocation()

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden border-r border-line bg-surface transition-[width] duration-200 ease-out md:flex dark:border-line-dark dark:bg-surface-dark ${
        collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
      }`}
    >
      <div className={`flex items-center gap-2 px-3 pt-6 pb-5 ${collapsed ? 'flex-col' : 'justify-between'}`}>
        {!collapsed && (
          <div className="min-w-0 px-2">
            <p className="font-display truncate text-lg font-semibold tracking-tight text-ink dark:text-ink-dark">
              Airbnb Manager
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-muted dark:text-ink-muted-dark">
              Apê dos sonhos em Ponta Negra
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={iconButton}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <svg
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
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
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : 'gap-2.5'
              } ${
                active
                  ? 'bg-accent-soft text-accent dark:bg-accent-soft-dark dark:text-accent-dark'
                  : 'text-ink-muted hover:bg-paper hover:text-ink dark:text-ink-muted-dark dark:hover:bg-paper-dark dark:hover:text-ink-dark'
              }`}
            >
              <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                {item.icon}
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className={`flex items-center gap-2 border-t border-line p-3 dark:border-line-dark ${collapsed ? 'flex-col' : 'justify-between'}`}>
        <ThemeToggle />
        <button
          type="button"
          onClick={onSignOut}
          title={collapsed ? 'Sair' : undefined}
          className={collapsed ? `${buttonSignOut} !w-9 !px-0` : buttonSignOut}
        >
          {collapsed ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d={SIGN_OUT_ICON_PATH} />
            </svg>
          ) : (
            'Sair'
          )}
        </button>
      </div>
    </aside>
  )
}
