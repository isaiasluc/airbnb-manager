import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'
import type { OAuth2Client } from 'googleapis-common'
import type { CreateReservationInput } from '../types'
import { reservationExistsByEmailId } from '../repositories/reservation.repository'
import { createReservation } from './reservation.service'

// ─── OAuth2 setup ─────────────────────────────────────────────────────────────

const TOKEN_PATH = path.resolve(process.env.GOOGLE_TOKEN_PATH ?? './google-token.json')

function createOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

function loadToken(client: OAuth2Client): void {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      `Token não encontrado em ${TOKEN_PATH}. ` +
      `Execute primeiro: npx tsx scripts/auth-google.ts`
    )
  }
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
  client.setCredentials(token)
  client.on('tokens', (tokens) => {
    const current = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
    fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...current, ...tokens }, null, 2))
  })
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function extractText(body: string): string {
  return body
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&atilde;/g, 'ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDate(dateStr: string, timeStr: string): Date {
  const currentYear = new Date().getFullYear()
  const normalized = `${dateStr.replace(/^[A-Za-z]+,\s*/, '')} ${currentYear} ${timeStr}`
  const parsed = new Date(normalized)
  // Ajusta para Brasília (UTC-3)
  const brazilOffset = -3 * 60
  const localOffset  = parsed.getTimezoneOffset()
  const diff         = (localOffset - brazilOffset) * 60 * 1000
  return new Date(parsed.getTime() + diff)
}

function parseHostPayout(text: string): number {
  const match = text.match(/You earn\s+R\$\s*([\d.,]+)/)
  if (!match) throw new Error('Não foi possível extrair o host payout')
  const raw = match[1]
  // Normaliza BR (1.193,08) e US (1,193.08)
  const normalized = raw.includes(',') && raw.indexOf(',') > raw.indexOf('.')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(/,/g, '')
  return parseFloat(normalized)
}

function splitGuestName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/)
  const [first_name, ...lastNameParts] = parts

  return {
    first_name,
    last_name: lastNameParts.join(' '),
  }
}

function getNamePattern(): string {
  const capitalizedNameToken = String.raw`[A-ZÀ-Ý][\p{L}'’-]*`
  const nameParticle = String.raw`(?:d[aeo]s?|de|del|di|la|las|los|van|von)`
  return `${capitalizedNameToken}(?:\\s+(?:${nameParticle}|${capitalizedNameToken}))*`
}

function parseGuestName(text: string): { first_name: string; last_name: string } {
  const fullNamePattern = getNamePattern()

  const identityVerifiedIndex = text.indexOf('Identity verified')
  if (identityVerifiedIndex >= 0) {
    const beforeIdentityVerified = text.slice(0, identityVerifiedIndex).trim()
    const identityVerifiedMatch = beforeIdentityVerified.match(new RegExp(`(${fullNamePattern})$`, 'iu'))
    if (identityVerifiedMatch) {
      return splitGuestName(identityVerifiedMatch[1])
    }
  }

  const arrivesMatch = text.match(new RegExp(`booking confirmed!\\s+(${fullNamePattern})\\s+arrives`, 'iu'))
  if (arrivesMatch) {
    return splitGuestName(arrivesMatch[1])
  }

  throw new Error('Nome do hóspede não encontrado')
}

function parseEmail(rawText: string): Omit<CreateReservationInput, 'source_email_id'> {
  const text = extractText(rawText)

  const { first_name, last_name } = parseGuestName(text)

  const codeMatch = text.match(/Confirmation code\s+([A-Z0-9]{8,12})/)
  if (!codeMatch) throw new Error('Código de confirmação não encontrado')
  const confirmation_code = codeMatch[1]

  const checkinMatch  = text.match(/Check-in\s+((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\w+\s+\d+)\s+([\d:]+\s+[AP]M)/)
  const checkoutMatch = text.match(/Checkout\s+((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\w+\s+\d+)\s+([\d:]+\s+[AP]M)/)
  if (!checkinMatch || !checkoutMatch) throw new Error('Datas de check-in/checkout não encontradas')

  const checkin_at  = parseDate(checkinMatch[1], checkinMatch[2])
  const checkout_at = parseDate(checkoutMatch[1], checkoutMatch[2])

  const guestsMatch  = text.match(/(\d+)\s+adults?/)
  const guests_count = guestsMatch ? parseInt(guestsMatch[1]) : 1

  const host_payout = parseHostPayout(text)

  return {
    guest: { first_name, last_name },
    confirmation_code,
    checkin_at,
    checkout_at,
    guests_count,
    host_payout,
    currency: 'BRL',
  }
}

// ─── Sync principal ───────────────────────────────────────────────────────────

export interface SyncResult {
  imported: number
  skipped:  number
  errors:   { emailId: string; reason: string }[]
}

export async function syncGmailReservations(): Promise<SyncResult> {
  const client = createOAuthClient()
  loadToken(client)

  const gmail  = google.gmail({ version: 'v1', auth: client })
  const result: SyncResult = { imported: 0, skipped: 0, errors: [] }

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:automated@airbnb.com subject:"Reservation confirmed"',
    maxResults: 50,
  })

  const messages = listRes.data.messages ?? []
  if (messages.length === 0) return result

  for (const msg of messages) {
    const emailId = msg.id!

    if (await reservationExistsByEmailId(emailId)) {
      result.skipped++
      continue
    }

    try {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full',
      })

      const parts    = full.data.payload?.parts ?? []
      const htmlPart = parts.find((p: any) => p.mimeType === 'text/html')
      const textPart = parts.find((p: any) => p.mimeType === 'text/plain')
      const bodyData = (htmlPart ?? textPart)?.body?.data

      if (!bodyData) {
        result.errors.push({ emailId, reason: 'Corpo do email vazio' })
        continue
      }

      const decoded = Buffer.from(bodyData, 'base64url').toString('utf-8')
      const parsed  = parseEmail(decoded)

      await createReservation({ ...parsed, source_email_id: emailId })
      result.imported++
    } catch (err) {
      result.errors.push({ emailId, reason: (err as Error).message })
    }
  }

  return result
}
