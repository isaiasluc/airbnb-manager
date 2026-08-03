import type { FormEvent } from 'react'

/** Props do layout de login — toda a lógica de autenticação fica em `pages/Login.tsx`. */
export type LoginLayoutProps = {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  error: string | null
  submitting: boolean
  disabled: boolean
}
