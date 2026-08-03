/** Botão principal do login, com estado de carregamento. */
export default function LoginSubmitButton({
  submitting,
  disabled,
}: {
  submitting: boolean
  disabled: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-accent-grad-from)] to-[var(--color-accent-grad-to)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter,box-shadow] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:from-[var(--color-accent-grad-from-dark)] dark:to-[var(--color-accent-grad-to-dark)] dark:text-ink"
    >
      {submitting ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Entrando...
        </>
      ) : (
        <>
          Entrar
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0-5.25-5.25M19.5 12l-5.25 5.25" />
          </svg>
        </>
      )}
    </button>
  )
}
