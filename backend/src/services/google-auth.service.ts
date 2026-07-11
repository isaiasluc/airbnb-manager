import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { google } from 'googleapis'
import type { OAuth2Client } from 'googleapis-common'
import type { Credentials } from 'google-auth-library'
import crypto from 'crypto'

const STATE_TTL_MS = 10 * 60 * 1000
const states = new Map<string, number>()

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'
export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send'
const GMAIL_SCOPES = [GMAIL_READONLY_SCOPE, GMAIL_SEND_SCOPE]

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variável ${name} não configurada`)
  return value
}

// Lazy singleton — só inicializa quando chamado pela primeira vez,
// garantindo que dotenv já rodou antes da inicialização do client.
let _secretClient: SecretManagerServiceClient | null = null

function getSecretClient(): SecretManagerServiceClient {
  if (!_secretClient) {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const projectId = process.env.FIREBASE_PROJECT_ID

    _secretClient = clientEmail && privateKey
      ? new SecretManagerServiceClient({ credentials: { client_email: clientEmail, private_key: privateKey }, projectId })
      : new SecretManagerServiceClient({ projectId })
  }
  return _secretClient
}

function getSecretResourceName(): string {
  const project = requireEnv('FIREBASE_PROJECT_ID')
  const secretId = requireEnv('GOOGLE_TOKEN_SECRET_NAME')
  return `projects/${project}/secrets/${secretId}`
}

export function createGoogleOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    requireEnv('GOOGLE_CLIENT_ID'),
    requireEnv('GOOGLE_CLIENT_SECRET'),
    requireEnv('GOOGLE_REDIRECT_URI'),
  )
}

export async function saveGoogleToken(tokens: Credentials): Promise<void> {
  await getSecretClient().addSecretVersion({
    parent: getSecretResourceName(),
    payload: { data: Buffer.from(JSON.stringify(tokens)) },
  })
}

export async function hasGoogleToken(): Promise<boolean> {
  try {
    await getSecretClient().accessSecretVersion({
      name: `${getSecretResourceName()}/versions/latest`,
    })
    return true
  } catch {
    return false
  }
}

export async function loadGoogleToken(client: OAuth2Client): Promise<void> {
  const [version] = await getSecretClient().accessSecretVersion({
    name: `${getSecretResourceName()}/versions/latest`,
  })

  const data = version.payload?.data
  if (!data) throw new Error('Gmail ainda não autenticado. Autorize o Google antes de sincronizar.')

  const token: Credentials = JSON.parse(
    typeof data === 'string' ? data : Buffer.from(data).toString('utf-8'),
  )

  client.setCredentials(token)
  client.on('tokens', async (newTokens) => {
    await saveGoogleToken({ ...token, ...newTokens })
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
