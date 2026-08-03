import { useId, useState } from 'react'

const MAIL_ICON = 'M3.75 6.75h16.5v10.5H3.75zM3.75 7.5 12 13.5l8.25-6'
const LOCK_ICON = 'M6.75 10.5V7.5a5.25 5.25 0 0 1 10.5 0v3M5.25 10.5h13.5v9.75H5.25z'

const EYE_ICON = 'M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z'
const EYE_OFF_ICON = 'M3 3l18 18M10.6 10.7a2.25 2.25 0 0 0 3.1 3.2M6.5 6.7C4 8.3 2.25 12 2.25 12s3.75 6.75 9.75 6.75c1.7 0 3.2-.5 4.5-1.3M9.9 5.5c.7-.2 1.4-.25 2.1-.25 6 0 9.75 6.75 9.75 6.75s-.8 1.5-2.3 3'

type LoginFieldProps = {
  label: string
  type: 'email' | 'password'
  value: string
  onChange: (value: string) => void
  autoComplete: string
  placeholder?: string
  invalid?: boolean
  /** `glass` clareia o fundo do campo para uso sobre superfícies translúcidas. */
  tone?: 'default' | 'glass'
}

export default function LoginField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  invalid = false,
  tone = 'default',
}: LoginFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && revealed ? 'text' : type

  const background =
    tone === 'glass'
      ? 'bg-surface/70 dark:bg-paper-dark/50'
      : 'bg-surface dark:bg-paper-dark'

  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-widest text-ink-muted uppercase dark:text-ink-muted-dark"
      >
        {label}
      </label>
      <div className="relative mt-1.5">
        <svg
          className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted/70 dark:text-ink-muted-dark/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={isPassword ? LOCK_ICON : MAIL_ICON} />
        </svg>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          aria-invalid={invalid || undefined}
          className={`h-12 w-full rounded-xl border border-line ${background} pl-11 ${
            isPassword ? 'pr-11' : 'pr-3.5'
          } text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-line-dark dark:text-ink-dark dark:placeholder:text-ink-muted-dark/60 dark:focus:border-accent-dark dark:focus:ring-accent-dark/25`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            title={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark"
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d={revealed ? EYE_OFF_ICON : EYE_ICON} />
              {!revealed && <circle cx="12" cy="12" r="2.75" />}
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
