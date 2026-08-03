/** Selo com o gradiente da marca — usado no topo dos layouts de login. */
export default function LoginBrandMark({
  className = 'h-11 w-11',
  onDark = false,
}: {
  className?: string
  onDark?: boolean
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${
        onDark
          ? 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm'
          : 'bg-gradient-to-br from-[var(--color-accent-grad-from)] to-[var(--color-accent-grad-to)] text-white shadow-sm dark:from-[var(--color-accent-grad-from-dark)] dark:to-[var(--color-accent-grad-to-dark)] dark:text-ink'
      } ${className}`}
      aria-hidden="true"
    >
      <svg className="h-1/2 w-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75V20a1 1 0 0 0 1 1h11.5a1 1 0 0 0 1-1V9.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21v-5.25a2.25 2.25 0 0 1 4.5 0V21" />
      </svg>
    </span>
  )
}
