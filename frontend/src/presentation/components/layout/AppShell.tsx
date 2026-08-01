import { useEffect, useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'

const STORAGE_KEY = 'sidebar-collapsed'

function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(max-width: 767px)').matches
}

export default function AppShell({
  onSignOut,
  children,
}: {
  onSignOut: () => void
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  return (
    <div className="min-h-screen bg-paper font-sans transition-colors dark:bg-paper-dark">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onSignOut={onSignOut}
      />
      <div className={`transition-[padding] duration-200 ease-out ${collapsed ? 'pl-16' : 'pl-60'}`}>
        {children}
      </div>
    </div>
  )
}
