import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'
import type { OAuth2Client } from 'googleapis-common'
import type { Credentials } from 'google-auth-library'
import crypto from 'crypto'

const DEFAULT_TOKEN_PATH = './data/google-token.json'
const TOKEN_PATH = path.resolve(process.env.GOOGLE_TOKEN_PATH ?? DEFAULT_TOKEN_PATH)
const STATE_TTL_MS = 10 * 60 * 1000
const states = new Map<string, number>()

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'
export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send'
const GMAIL_SCOPES = [GMAIL_READONLY_SCOPE, GMAIL_SEND_SCOPE]

function requireGoogleEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variável ${name} não configurada`)
  return value
}

export function createGoogleOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    requireGoogleEnv('GOOGLE_CLIENT_ID'),
    requireGoogleEnv('GOOGLE_CLIENT_SECRET'),
    requireGoogleEnv('GOOGLE_REDIRECT_URI'),
  )
}

function ensureTokenDir() {
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true })
}

export function saveGoogleToken(tokens: Credentials): void {
  ensureTokenDir()
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2))
}

export function hasGoogleToken(): boolean {
  return fs.existsSync(TOKEN_PATH)
}

export function loadGoogleToken(client: OAuth2Client): void {
  if (!hasGoogleToken()) {
    throw new Error('Gmail ainda não autenticado. Autorize o Google antes de sincronizar.')
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
  client.setCredentials(token)
  client.on('tokens', (tokens) => {
    const current = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
    saveGoogleToken({ ...current, ...tokens })
  })
}

export async function getAuthenticatedGmailAddress(client: OAuth2Client): Promise<string | null> {
  const gmail = google.gmail({ version: 'v1', auth: client })
  const profile = await gmail.users.getProfile({ userId: 'me' })
  return profile.data.emailAddress?.toLowerCase() ?? null
}

function pruneExpiredStates() {
  const now = Date.now()
  for (const [state, expiresAt] of states.entries()) {
    if (expiresAt <= now) states.delete(state)
  }
}

export function createGoogleAuthUrl(): string {
  pruneExpiredStates()

  const state = crypto.randomBytes(24).toString('hex')
  states.set(state, Date.now() + STATE_TTL_MS)

  return createGoogleOAuthClient().generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
    state,
  })
}

export function consumeGoogleAuthState(state: string): boolean {
  pruneExpiredStates()

  const expiresAt = states.get(state)
  if (!expiresAt) return false

  states.delete(state)
  return expiresAt > Date.now()
}
