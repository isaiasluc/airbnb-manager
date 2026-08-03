/** Mensagem de erro do login, anunciada por leitores de tela. */
export default function LoginError({ message }: { message: string | null }) {
  return (
    <div role="alert" aria-live="polite" className="empty:hidden">
      {message && (
        <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.9}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7.75v5" />
            <path strokeLinecap="round" d="M12 16.25h.01" />
          </svg>
          {message}
        </p>
      )}
    </div>
  )
}
