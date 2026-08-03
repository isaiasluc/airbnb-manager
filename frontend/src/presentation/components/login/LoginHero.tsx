import ThemeToggle from '@/presentation/shared/ThemeToggle'
import LoginBrandMark from './LoginBrandMark'
import LoginError from './LoginError'
import LoginField from './LoginField'
import LoginSubmitButton from './LoginSubmitButton'
import type { LoginLayoutProps } from './types'

const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
  backgroundSize: '56px 56px',
  maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent 75%)',
  WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent 75%)',
}

/** Layout C — fundo imersivo com malha e cartão de vidro sobre o gradiente da marca. */
export default function LoginHero({
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
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-soft via-paper to-dune/25 dark:from-accent-soft-dark dark:via-paper-dark dark:to-[#1d2a22]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 -left-24 h-[30rem] w-[30rem] rounded-full bg-accent/25 blur-[100px] dark:bg-accent-dark/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 -bottom-40 h-[32rem] w-[32rem] rounded-full bg-dune/25 blur-[100px] dark:bg-dune-dark/15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 text-ink/[0.07] dark:text-ink-dark/[0.06]"
        style={GRID_STYLE}
        aria-hidden="true"
      />

      <header className="relative flex justify-end px-6 py-5">
        <ThemeToggle />
      </header>

      <main className="relative mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-md items-center px-6 pb-16">
        <div className="w-full rounded-3xl border border-white/60 bg-surface/75 p-8 shadow-[0_24px_60px_-20px_rgba(22,33,29,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/70 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex items-center gap-3">
            <LoginBrandMark className="h-11 w-11" />
            <div className="min-w-0">
              <p className="font-display truncate text-base font-semibold tracking-tight text-ink dark:text-ink-dark">
                Airbnb Manager
              </p>
              <p className="truncate text-xs text-ink-muted dark:text-ink-muted-dark">
                Apê dos sonhos em Ponta Negra
              </p>
            </div>
          </div>

          <h1 className="font-display mt-8 text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
            Entrar
          </h1>
          <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
            Use suas credenciais para abrir o painel de reservas.
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
            <LoginField
              label="E-mail"
              type="email"
              value={email}
              onChange={onEmailChange}
              autoComplete="email"
              placeholder="voce@email.com"
              invalid={Boolean(error)}
              tone="glass"
            />
            <LoginField
              label="Senha"
              type="password"
              value={password}
              onChange={onPasswordChange}
              autoComplete="current-password"
              placeholder="••••••••"
              invalid={Boolean(error)}
              tone="glass"
            />
            <LoginError message={error} />
            <LoginSubmitButton submitting={submitting} disabled={disabled} />
          </form>

          <p className="mt-7 border-t border-line pt-5 text-center text-xs text-ink-muted dark:border-line-dark dark:text-ink-muted-dark">
            Acesso restrito ao administrador do imóvel.
          </p>
        </div>
      </main>
    </div>
  )
}
