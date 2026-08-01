export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border border-line bg-paper p-1 dark:border-line-dark dark:bg-paper-dark ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-surface text-ink shadow-sm dark:bg-surface-dark dark:text-ink-dark'
              : 'text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
