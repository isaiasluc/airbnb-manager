import { authFetch, BASE } from '../http/apiClient'

export interface GoogleAuthStatus {
  authenticated: boolean
}

export async function fetchGoogleAuthStatus(): Promise<GoogleAuthStatus> {
  const res = await authFetch(`${BASE}/google-auth/status`)
  if (!res.ok) throw new Error('Erro ao buscar autenticação Google')
  return res.json()
}

export async function startGoogleAuth(): Promise<string> {
  const res = await authFetch(`${BASE}/google-auth/start`, { method: 'POST' })
  if (!res.ok) throw new Error('Erro ao iniciar autenticação Google')
  const data = (await res.json()) as { authUrl?: string }
  if (!data.authUrl)
    throw new Error('URL de autenticação Google não encontrada')
  return data.authUrl
}
