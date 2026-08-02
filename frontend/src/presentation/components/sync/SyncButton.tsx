import { iconButtonPrimary } from '@/presentation/shared/buttonStyles'
import Tooltip from '@/presentation/shared/Tooltip'

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
      <Tooltip label={syncing ? 'Sincronizando...' : 'Sincronizar Gmail'}>
        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          aria-label="Sincronizar Gmail"
          className={iconButtonPrimary}
        >
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
        </button>
      </Tooltip>
    )
  }

  return (
    <Tooltip label={authenticatingGoogle ? 'Abrindo Google...' : 'Autenticar Google'}>
      <button
        type="button"
        onClick={onGoogleAuth}
        disabled={authenticatingGoogle}
        aria-label="Autenticar Google"
        className={iconButtonPrimary}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
          />
        </svg>
      </button>
    </Tooltip>
  )
}
