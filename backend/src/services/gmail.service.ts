import { google } from 'googleapis'
import type { CreateReservationInput } from '../types'
import { reservationExistsByEmailId } from '../repositories/reservation.repository'
import { createReservation } from './reservation.service'
import { createGoogleOAuthClient, getAuthenticatedGmailAddress, loadGoogleToken } from './google-auth.service'
import { getAllowedSyncEmail } from '../middlewares/require-sync-email'

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
  const dateWithoutWeekday = dateStr.replace(/^[A-Za-z]+,\s*/, '')
  const dateWithYear = /\d{4}/.test(dateWithoutWeekday)
    ? dateWithoutWeekday
    : `${dateWithoutWeekday}, ${currentYear}`
  const parsed = new Date(`${dateWithYear} ${timeStr} GMT-0300`)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data inválida: ${dateStr} ${timeStr}`)
  }

  return parsed
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

function parseGuestCount(text: string): number {
  const guestsSection = text.match(/GUESTS\s+(.+?)\s+MORE DETAILS ABOUT WHO’S COMING/i)?.[1] ?? text
  const guestTypes = ['adult', 'child', 'infant']
  const count = guestTypes.reduce((total, type) => {
    const match = guestsSection.match(new RegExp(`(\\d+)\\s+${type}(?:ren|s)?`, 'i'))
    return total + (match ? parseInt(match[1], 10) : 0)
  }, 0)

  return count || 1
}

function splitGuestName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/)
  const [first_name, ...lastNameParts] = parts

  return {
    first_name,
    last_name: lastNameParts.join(' '),
  }
}

function parseGuestNameFromSubject(subject: string): { first_name: string; last_name: string } {
  const match = subject.match(/^Reservation confirmed\s+-\s+(.+?)\s+arrives\s+[A-Za-z]{3,}\s+\d{1,2}/i)
  if (!match) throw new Error('Nome do hóspede não encontrado no assunto do email')

  return splitGuestName(match[1])
}

const airbnbDatePattern = String.raw`(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+[A-Za-z]+\s+\d{1,2}(?:,\s+\d{4})?`
const airbnbTimePattern = String.raw`\d{1,2}(?::\d{2})?\s+[AP]M`

function parseReservationDates(text: string): { checkin_at: Date; checkout_at: Date } {
  const inlineCheckinMatch = text.match(new RegExp(`Check-in\\s+(${airbnbDatePattern})\\s+(${airbnbTimePattern})`, 'i'))
  const inlineCheckoutMatch = text.match(new RegExp(`Checkout\\s+(${airbnbDatePattern})\\s+(${airbnbTimePattern})`, 'i'))

  if (inlineCheckinMatch && inlineCheckoutMatch) {
    return {
      checkin_at: parseDate(inlineCheckinMatch[1], inlineCheckinMatch[2]),
      checkout_at: parseDate(inlineCheckoutMatch[1], inlineCheckoutMatch[2]),
    }
  }

  const tableMatch = text.match(
    new RegExp(
      `Check-in\\s+Checkout\\s+(${airbnbDatePattern})\\s+(${airbnbDatePattern})\\s+(${airbnbTimePattern})\\s+(${airbnbTimePattern})`,
      'i'
    )
  )

  if (tableMatch) {
    return {
      checkin_at: parseDate(tableMatch[1], tableMatch[3]),
      checkout_at: parseDate(tableMatch[2], tableMatch[4]),
    }
  }

  throw new Error('Datas de check-in/checkout não encontradas')
}

export function parseEmail(rawText: string, subject: string): Omit<CreateReservationInput, 'source_email_id'> {
  const text = extractText(rawText)

  const { first_name, last_name } = parseGuestNameFromSubject(subject)

  const codeMatch = text.match(/Confirmation code\s+([A-Z0-9]{8,12})/)
  if (!codeMatch) throw new Error('Código de confirmação não encontrado')
  const confirmation_code = codeMatch[1]

  const { checkin_at, checkout_at } = parseReservationDates(text)

  const guests_count = parseGuestCount(text)

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
  importedItems: SyncItem[]
  skippedItems:  SyncItem[]
  errors:   { emailId: string; reason: string }[]
}

export interface SyncItem {
  emailId: string
  subject: string
  guestName?: string
  confirmationCode?: string
  reason?: string
}

function getGuestNameFromSubject(subject: string): string | undefined {
  try {
    const guest = parseGuestNameFromSubject(subject)
    return [guest.first_name, guest.last_name].filter(Boolean).join(' ')
  } catch {
    return undefined
  }
}

export async function syncGmailReservations(): Promise<SyncResult> {
  const client = createGoogleOAuthClient()
  loadGoogleToken(client)

  const googleEmail = await getAuthenticatedGmailAddress(client)
  if (googleEmail !== getAllowedSyncEmail()) {
    throw new Error('Token Google autorizado para um email diferente do permitido')
  }

  const gmail  = google.gmail({ version: 'v1', auth: client })
  const result: SyncResult = {
    imported: 0,
    skipped: 0,
    importedItems: [],
    skippedItems: [],
    errors: [],
  }

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:automated@airbnb.com subject:"Reservation confirmed"',
    maxResults: 50,
  })

  const messages = listRes.data.messages ?? []
  if (messages.length === 0) return result

  for (const msg of messages) {
    const emailId = msg.id!

    try {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full',
      })

      const parts    = full.data.payload?.parts ?? []
      const headers  = full.data.payload?.headers ?? []
      const subject  = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value ?? ''
      const htmlPart = parts.find((p: any) => p.mimeType === 'text/html')
      const textPart = parts.find((p: any) => p.mimeType === 'text/plain')
      const bodyData = (htmlPart ?? textPart)?.body?.data

      if (await reservationExistsByEmailId(emailId)) {
        result.skipped++
        result.skippedItems.push({
          emailId,
          subject,
          guestName: getGuestNameFromSubject(subject),
          reason: 'Já importada',
        })
        continue
      }

      if (!bodyData) {
        result.errors.push({ emailId, reason: 'Corpo do email vazio' })
        continue
      }

      const decoded = Buffer.from(bodyData, 'base64url').toString('utf-8')
      const parsed  = parseEmail(decoded, subject)
      const created = await createReservation({ ...parsed, source_email_id: emailId })

      result.imported++
      result.importedItems.push({
        emailId,
        subject,
        guestName: [parsed.guest.first_name, parsed.guest.last_name].filter(Boolean).join(' '),
        confirmationCode: created.confirmation_code,
      })
    } catch (err) {
      result.errors.push({ emailId, reason: (err as Error).message })
    }
  }

  return result
}
