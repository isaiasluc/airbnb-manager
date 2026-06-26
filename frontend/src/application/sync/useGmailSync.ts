import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { useSearchParams } from 'react-router-dom'
import type { SyncResult, SyncStatus } from '@/domain/entities/sync'
import { fetchSyncStatus, syncEmails } from '@/infrastructure/sync/syncApi'
import {
  fetchGoogleAuthStatus,
  startGoogleAuth,
} from '@/infrastructure/sync/googleAuthApi'

const SYNC_MODAL_ANIMATION_MS = 180

export const ALLOWED_SYNC_EMAIL =
  import.meta.env.VITE_SYNC_ALLOWED_EMAIL ?? 'isaiiaslucena@gmail.com'

function getGoogleAuthMessage(value: string | null) {
  if (value === 'success') return 'Google autenticado. Sincronização liberada.'
  if (value === 'error') return 'Erro ao autenticar Google. Tente novamente.'
  if (value === 'wrongEmail') {
    return `Use o Google ${ALLOWED_SYNC_EMAIL} para liberar a sincronização.`
  }
  return null
}

interface UseGmailSyncOptions {
  user: User | null
  onAfterImport: () => Promise<void> | void
}

export function useGmailSync({ user, onAfterImport }: UseGmailSyncOptions) {
  const [searchParams] = useSearchParams()
  const canSyncGmail =
    user?.email?.toLowerCase() === ALLOWED_SYNC_EMAIL.toLowerCase()
  const initialGoogleAuth = canSyncGmail ? searchParams.get('googleAuth') : null

  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(() =>
    getGoogleAuthMessage(initialGoogleAuth),
  )
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [isSyncModalClosing, setIsSyncModalClosing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [googleAuthenticated, setGoogleAuthenticated] = useState(
    initialGoogleAuth === 'success',
  )
  const [authenticatingGoogle, setAuthenticatingGoogle] = useState(false)

  useEffect(() => {
    if (!canSyncGmail) return
    let isMounted = true
    Promise.all([
      fetchSyncStatus().catch(() => null),
      fetchGoogleAuthStatus().catch(() => ({ authenticated: false })),
    ]).then(([status, googleAuth]) => {
      if (!isMounted) return
      setSyncStatus(status)
      setGoogleAuthenticated(googleAuth.authenticated)
    })
    return () => {
      isMounted = false
    }
  }, [canSyncGmail])

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    setSyncResult(null)
    setIsSyncModalOpen(false)
    setIsSyncModalClosing(false)
    try {
      const result = await syncEmails()
      if (result.syncStatus) setSyncStatus(result.syncStatus)
      setSyncResult(result)
      setSyncMsg(
        `${result.imported} importada(s) · ${result.skipped} ignorada(s) · ${result.errors.length} erro(s)`,
      )
      if (result.imported > 0) await onAfterImport()
    } catch {
      setSyncMsg('Erro ao sincronizar.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleGoogleAuth() {
    setAuthenticatingGoogle(true)
    setSyncMsg(null)
    try {
      const authUrl = await startGoogleAuth()
      window.location.assign(authUrl)
    } catch {
      setAuthenticatingGoogle(false)
      setSyncMsg('Erro ao iniciar autenticação Google.')
    }
  }

  function openSyncModal() {
    if (!syncResult) return
    setIsSyncModalClosing(false)
    setIsSyncModalOpen(true)
  }

  function closeSyncModal() {
    setIsSyncModalClosing(true)
    window.setTimeout(() => {
      setIsSyncModalOpen(false)
      setIsSyncModalClosing(false)
    }, SYNC_MODAL_ANIMATION_MS)
  }

  return {
    canSyncGmail,
    syncing,
    syncMsg,
    setSyncMsg,
    syncResult,
    isSyncModalOpen,
    isSyncModalClosing,
    syncStatus,
    googleAuthenticated,
    authenticatingGoogle,
    handleSync,
    handleGoogleAuth,
    openSyncModal,
    closeSyncModal,
  }
}
