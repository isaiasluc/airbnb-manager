import ThemeToggle from '@/presentation/shared/ThemeToggle'
import LoginBrandMark from './LoginBrandMark'
import LoginError from './LoginError'
import LoginField from './LoginField'
import LoginSubmitButton from './LoginSubmitButton'
import type { LoginLayoutProps } from './types'

const HIGHLIGHTS = [
  {
    title: 'Reservas direto do Gmail',
    description: 'Os e-mails de confirmação viram reservas sozinhos, sem digitação.',
    icon: 'M3.75 6.75h16.5v10.5H3.75zM3.75 7.5 12 13.5l8.25-6',
  },
  {
    title: 'Calendário de ocupação',
    description: 'Veja noites ocupadas, entradas e saídas de um jeito só.',
    icon: 'M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5v12.75H3.75zM3.75 11.25h16.5',
  },
  {
    title: 'Financeiro consolidado',
    description: 'Receita, taxas e despesas calculadas a cada sincronização.',
    icon: 'M3.75 19.5h16.5M7.5 16.5V9.75M12 16.5V5.25M16.5 16.5v-4.5',
  },
]

/** Layout A — painel de marca à esquerda, formulário à direita. */
export default function LoginSplit({
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
    <div className="min-h-screen bg-paper font-sans transition-colors lg:grid lg:grid-cols-[1.05fr_1fr] dark:bg-paper-dark">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[var(--color-accent-grad-from)] to-[var(--color-accent-grad-to)] p-12 lg:flex lg:flex-col lg:justify-between dark:from-[var(--color-accent-grad-to-dark)] dark:to-[#7a2f14]">
        <div
          className="pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full bg-white/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-10 h-96 w-96 rounded-full bg-[var(--color-dune)]/30 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <LoginBrandMark className="h-10 w-10" onDark />
          <span className="font-display text-lg font-semibold tracking-tight text-white">Airbnb Manager</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl leading-[1.15] font-semibold tracking-tight text-balance text-white">
            Suas reservas organizadas antes de você abrir o app.
          </h2>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight.title} className="flex gap-4">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
                  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={highlight.icon} />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{highlight.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{highlight.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/70">Apê dos sonhos em Ponta Negra</p>
      </section>

      <section className="flex min-h-screen flex-col lg:min-h-0">
        <header className="flex justify-end px-6 py-5 lg:px-10">
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-16 lg:px-10">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-3 lg:hidden">
              <LoginBrandMark className="h-11 w-11" />
              <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-ink-dark">
                Airbnb Manager
              </span>
            </div>

            <h1 className="font-display mt-8 text-3xl font-semibold tracking-tight text-ink lg:mt-0 dark:text-ink-dark">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
              Entre para acompanhar as reservas do apartamento.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
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

            <p className="mt-8 text-center text-xs text-ink-muted dark:text-ink-muted-dark">
              Acesso restrito ao administrador do imóvel.
            </p>
          </div>
        </main>
      </section>
    </div>
  )
}
