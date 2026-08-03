import ThemeToggle from '@/presentation/shared/ThemeToggle'
import LoginBrandMark from './LoginBrandMark'
import LoginError from './LoginError'
import LoginField from './LoginField'
import LoginSubmitButton from './LoginSubmitButton'
import type { LoginLayoutProps } from './types'

/** Layout B — cartão centralizado sobre fundo com halos suaves da marca. */
export default function LoginCard({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  error,
  submitting,
  disabled,
}: LoginLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-paper font-sans transition-colors dark:bg-paper-dark">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl dark:bg-accent-dark/12"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-24 h-[26rem] w-[26rem] rounded-full bg-dune/15 blur-3xl dark:bg-dune-dark/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-10 h-[22rem] w-[22rem] rounded-full bg-accent/10 blur-3xl dark:bg-accent-dark/10"
        aria-hidden="true"
      />

      <header className="relative flex justify-end px-6 py-5">
        <ThemeToggle />
      </header>

      <main className="relative mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-md flex-col justify-center px-6 pb-16">
        <div className="flex flex-col items-center text-center">
          <LoginBrandMark className="h-14 w-14" />
          <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
            Airbnb Manager
          </h1>
          <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
            Apê dos sonhos em Ponta Negra
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-8 space-y-5 rounded-2xl border border-line bg-surface/90 p-7 shadow-[0_1px_2px_rgba(22,33,29,0.04),0_12px_32px_-12px_rgba(22,33,29,0.12)] backdrop-blur-sm transition-colors dark:border-line-dark dark:bg-surface-dark/90 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_12px_32px_-12px_rgba(0,0,0,0.5)]"
        >
          <LoginField
            label="E-mail"
            type="email"
            value={email}
            onChange={onEmailChange}
            autoComplete="email"
            placeholder="voce@email.com"
            invalid={Boolean(error)}
          />
          <LoginField
            label="Senha"
            type="password"
            value={password}
            onChange={onPasswordChange}
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={Boolean(error)}
          />
          <LoginError message={error} />
          <LoginSubmitButton submitting={submitting} disabled={disabled} />
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted dark:text-ink-muted-dark">
          Acesso restrito ao administrador do imóvel.
        </p>
      </main>
    </div>
  )
}
