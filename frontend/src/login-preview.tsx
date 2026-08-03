/**
 * Harness de desenvolvimento para comparar os layouts da tela de login.
 * Acesse `/login-preview.html?v=a|b|c` com o dev server rodando (`npm run dev`).
 * Parâmetros: `v` (layout), `error=1` (estado de erro), `loading=1` (enviando).
 * Não faz parte do bundle de produção — `vite build` só usa `index.html`.
 */
import { StrictMode, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@/presentation/shared/theme/ThemeProvider'
import LoginCard from '@/presentation/components/login/LoginCard'
import LoginHero from '@/presentation/components/login/LoginHero'
import LoginSplit from '@/presentation/components/login/LoginSplit'
import '@/index.css'

const LAYOUTS = {
  a: LoginSplit,
  b: LoginCard,
  c: LoginHero,
} as const

function LoginPreview() {
  const params = new URLSearchParams(window.location.search)
  const key = (params.get('v') ?? 'a').toLowerCase() as keyof typeof LAYOUTS
  const Layout = LAYOUTS[key] ?? LoginSplit
  const submitting = params.get('loading') === '1'
  const error = params.get('error') === '1' ? 'E-mail ou senha inválidos.' : null

  const [email, setEmail] = useState(params.get('error') === '1' ? 'isaias@email.com' : '')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <Layout
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      error={error}
      submitting={submitting}
      disabled={submitting}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LoginPreview />
    </ThemeProvider>
  </StrictMode>,
)
