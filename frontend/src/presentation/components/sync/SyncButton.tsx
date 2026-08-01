import { buttonPrimary } from '@/presentation/shared/buttonStyles'

export default function SyncButton({
  googleAuthenticated,
  syncing,
  authenticatingGoogle,
  onSync,
  onGoogleAuth,
}: {
  googleAuthenticated: boolean
  syncing: boolean
  authenticatingGoogle: boolean
  onSync: () => void
  onGoogleAuth: () => void
}) {
  if (googleAuthenticated) {
    return (
      <button type="button" onClick={onSync} disabled={syncing} className={buttonPrimary}>
        <svg
          className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {syncing ? 'Sincronizando...' : 'Sincronizar Gmail'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onGoogleAuth}
      disabled={authenticatingGoogle}
      className={buttonPrimary}
    >
      {authenticatingGoogle ? 'Abrindo Google...' : 'Autenticar Google'}
    </button>
  )
}
