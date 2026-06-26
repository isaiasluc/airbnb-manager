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
  return (
    <div className="fixed bottom-6 right-6 z-30">
      {googleAuthenticated ? (
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex h-11 items-center gap-2 rounded-lg bg-stone-900 px-5 text-sm font-medium text-white shadow-lg shadow-stone-900/15 transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-950 dark:shadow-black/30 dark:hover:bg-stone-300"
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
          {syncing ? 'Sincronizando...' : 'Sincronizar Gmail'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onGoogleAuth}
          disabled={authenticatingGoogle}
          className="h-11 rounded-lg bg-stone-900 px-5 text-sm font-medium text-white shadow-lg shadow-stone-900/15 transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-950 dark:shadow-black/30 dark:hover:bg-stone-300"
        >
          {authenticatingGoogle ? 'Abrindo Google...' : 'Autenticar Google'}
        </button>
      )}
    </div>
  )
}
