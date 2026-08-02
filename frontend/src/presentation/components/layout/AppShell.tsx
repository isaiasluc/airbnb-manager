import { useEffect, useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import MobileTopBar from './MobileTopBar'
import MobileNavDrawer from './MobileNavDrawer'

const STORAGE_KEY = 'sidebar-collapsed'

function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === 'true'
}

export default function AppShell({
  onSignOut,
  children,
}: {
  onSignOut: () => void
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  return (
    <div className="min-h-screen bg-paper font-sans transition-colors dark:bg-paper-dark">
      <MobileTopBar onOpenMenu={() => setDrawerOpen(true)} />
      {drawerOpen && (
        <MobileNavDrawer onClose={() => setDrawerOpen(false)} onSignOut={onSignOut} />
      )}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onSignOut={onSignOut}
      />
      <div
        className={`pt-14 transition-[padding] duration-200 ease-out md:pt-0 ${
          collapsed ? 'md:pl-16' : 'md:pl-60'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
