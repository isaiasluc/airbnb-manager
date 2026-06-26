import { auth } from '../firebase/firebase'

export const BASE = import.meta.env.VITE_API_URL ?? '/api'

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers)
  const token = await auth.currentUser?.getIdToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(input, {
    ...init,
    headers,
  })
}

export function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  return search.size ? `?${search.toString()}` : ''
}
