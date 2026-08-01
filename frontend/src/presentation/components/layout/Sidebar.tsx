import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from '@/presentation/shared/ThemeToggle'
import { buttonSignOut, iconButton } from '@/presentation/shared/buttonStyles'

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Hospedagens',
    isActive: (pathname: string) => pathname === '/' || pathname.startsWith('/reservations'),
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    ),
  },
  {
    to: '/expenses',
    label: 'Despesas',
    isActive: (pathname: string) => pathname.startsWith('/expenses'),
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
      />
    ),
  },
]

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
      className={`fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden border-r border-line bg-surface transition-[width] duration-200 ease-out dark:border-line-dark dark:bg-surface-dark ${
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
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : ''
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
              />
            </svg>
          ) : (
            'Sair'
          )}
        </button>
      </div>
    </aside>
  )
}
