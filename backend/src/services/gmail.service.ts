import { google, type gmail_v1 } from 'googleapis'
import type { CreateReservationInput } from '../types'
import { reservationExistsByEmailId } from '../repositories/reservation.repository'
import { cancelReservationByConfirmationCode, createReservation } from './reservation.service'
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

function buildDate(dateWithYear: string, timeStr: string, original: string): Date {
  const parsed = new Date(`${dateWithYear} ${timeStr} GMT-0300`)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data inválida: ${original} ${timeStr}`)
  }

  return parsed
}

function parseDate(dateStr: string, timeStr: string, referenceDate: Date): Date {
  const dateWithoutWeekday = dateStr.replace(/^[A-Za-z]+,\s*/, '')

  // Quando o e-mail já traz o ano, usa direto.
  if (/\d{4}/.test(dateWithoutWeekday)) {
    return buildDate(dateWithoutWeekday, timeStr, dateStr)
  }

  // Sem ano: a reserva é sempre na data de recebimento ou depois, então pega o
  // menor ano (a partir do ano do e-mail) em que a data fica >= ao recebimento.
  // Isso resolve tanto o ano correto quanto a virada de ano (ex.: Dez → Jan).
  const baseYear = referenceDate.getFullYear()
  for (let year = baseYear; year <= baseYear + 1; year++) {
    const candidate = buildDate(`${dateWithoutWeekday}, ${year}`, timeStr, dateStr)
    if (candidate.getTime() >= referenceDate.getTime()) return candidate
  }

  // Fallback (data no passado relativo ao e-mail): mantém o ano do e-mail.
  return buildDate(`${dateWithoutWeekday}, ${baseYear}`, timeStr, dateStr)
}

function parseAmount(raw: string): number {
  // Normaliza BR (1.193,08) e US (1,193.08)
  const normalized = raw.includes(',') && raw.indexOf(',') > raw.indexOf('.')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(/,/g, '')
  return parseFloat(normalized)
}

function parseHostPayout(text: string): number {
  // Formato novo: "You earn R$ 1.234,56"
  const newFormat = text.match(/You(?:'ll)?\s+earn\s+(?:R\$|USD|\$)?\s*([\d.,]+)/i)
  if (newFormat) return parseAmount(newFormat[1])

  // Formato antigo: "R$1.234,56 The money you earn hosting"
  const oldFormat = text.match(/R\$\s*([\d.,]+)\s+The money you earn hosting/i)
  if (oldFormat) return parseAmount(oldFormat[1])

  const snippet = text.slice(Math.max(0, text.search(/earn/i) - 30), text.search(/earn/i) + 80)
  const hint = snippet.length > 0 ? ` | trecho: "${snippet}"` : ' | padrão "earn" não encontrado'
  throw new Error(`Não foi possível extrair o host payout${hint}`)
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

function parseReservationDates(text: string, referenceDate: Date): { checkin_at: Date; checkout_at: Date } {
  const inlineCheckinMatch = text.match(new RegExp(`Check-in\\s+(${airbnbDatePattern})\\s+(${airbnbTimePattern})`, 'i'))
  const inlineCheckoutMatch = text.match(new RegExp(`Checkout\\s+(${airbnbDatePattern})\\s+(${airbnbTimePattern})`, 'i'))

  if (inlineCheckinMatch && inlineCheckoutMatch) {
    return {
      checkin_at: parseDate(inlineCheckinMatch[1], inlineCheckinMatch[2], referenceDate),
      checkout_at: parseDate(inlineCheckoutMatch[1], inlineCheckoutMatch[2], referenceDate),
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
      checkin_at: parseDate(tableMatch[1], tableMatch[3], referenceDate),
      checkout_at: parseDate(tableMatch[2], tableMatch[4], referenceDate),
    }
  }

  throw new Error('Datas de check-in/checkout não encontradas')
}

export function parseEmail(
  rawText: string,
  subject: string,
  referenceDate: Date = new Date(),
): Omit<CreateReservationInput, 'source_email_id'> {
  const text = extractText(rawText)

  const { first_name, last_name } = parseGuestNameFromSubject(subject)

  const codeMatch = text.match(/Confirmation code\s+([A-Z0-9]{8,12})/)
  if (!codeMatch) throw new Error('Código de confirmação não encontrado')
  const confirmation_code = codeMatch[1]

  const { checkin_at, checkout_at } = parseReservationDates(text, referenceDate)

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

// Assunto do e-mail de cancelamento do Airbnb, que já traz o código:
// "Canceled: Reservation HMXXXQTZKC for Nov 17 – 24, 2026".
const cancellationSubjectPattern = /cancell?ed:\s*reservation\s+([a-z0-9]{8,12})\b/i

// Fallbacks pelo corpo, caso o Airbnb mude o formato do assunto: o link do
// painel do host e a frase "...had to cancel reservation HMXXXQTZKC...".
const cancellationBodyPatterns = [
  /hosting\/reservations\/details\/([a-z0-9]{8,12})\b/i,
  /cancel(?:l?ed)?\s+reservation\s+([a-z0-9]{8,12})\b/i,
]

/**
 * Extrai o código de confirmação de um e-mail de cancelamento do Airbnb.
 * Esse e-mail não repete os dados da reserva (datas, payout), só identifica
 * qual reserva foi cancelada — o resto já está no banco pela importação.
 */
export function parseCancellationEmail(
  rawText: string,
  subject: string,
): { confirmation_code: string } {
  const fromSubject = subject.match(cancellationSubjectPattern)
  if (fromSubject) return { confirmation_code: fromSubject[1].toUpperCase() }

  const text = extractText(rawText)
  for (const pattern of cancellationBodyPatterns) {
    const fromBody = text.match(pattern)
    if (fromBody) return { confirmation_code: fromBody[1].toUpperCase() }
  }

  throw new Error('Código de confirmação não encontrado no email de cancelamento')
}

// ─── Sync principal ───────────────────────────────────────────────────────────

const CONFIRMATION_QUERY = 'from:automated@airbnb.com subject:"Reservation confirmed"'
// O Airbnb usa "Canceled" (en-US); aceitamos as duas grafias por segurança.
const CANCELLATION_QUERY =
  'from:automated@airbnb.com subject:Reservation (subject:canceled OR subject:cancelled)'

export interface SyncResult {
  imported: number
  skipped:  number
  cancelled: number
  importedItems: SyncItem[]
  skippedItems:  SyncItem[]
  cancelledItems: SyncItem[]
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

/** Pagina por todos os e-mails que casam com a busca, sem o limite de uma única página. */
async function listMessageIds(gmail: gmail_v1.Gmail, query: string): Promise<string[]> {
  const messages: { id?: string | null }[] = []
  let pageToken: string | undefined

  do {
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100,
      pageToken,
    })
    messages.push(...(listRes.data.messages ?? []))
    pageToken = listRes.data.nextPageToken ?? undefined
  } while (pageToken)

  return messages.map((message) => message.id).filter((id): id is string => !!id)
}

interface EmailContent {
  subject: string
  body: string | null
  receivedAt: Date
}

async function fetchEmail(gmail: gmail_v1.Gmail, emailId: string): Promise<EmailContent> {
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

  return {
    subject,
    body: bodyData ? Buffer.from(bodyData, 'base64url').toString('utf-8') : null,
    receivedAt: full.data.internalDate ? new Date(Number(full.data.internalDate)) : new Date(),
  }
}

function describeError(err: unknown): string {
  return err instanceof Error ? (err.message || err.constructor.name) : String(err)
}

/** Importa as reservas dos e-mails de confirmação (dedupe por `source_email_id`). */
async function importConfirmedReservations(
  gmail: gmail_v1.Gmail,
  result: SyncResult,
): Promise<void> {
  for (const emailId of await listMessageIds(gmail, CONFIRMATION_QUERY)) {
    try {
      const { subject, body, receivedAt } = await fetchEmail(gmail, emailId)

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

      if (!body) {
        result.errors.push({ emailId, reason: 'Corpo do email vazio' })
        continue
      }

      const parsed  = parseEmail(body, subject, receivedAt)
      const created = await createReservation({ ...parsed, source_email_id: emailId })

      result.imported++
      result.importedItems.push({
        emailId,
        subject,
        guestName: [parsed.guest.first_name, parsed.guest.last_name].filter(Boolean).join(' '),
        confirmationCode: created.confirmation_code,
      })
    } catch (err) {
      result.errors.push({ emailId, reason: describeError(err) })
    }
  }
}

/**
 * Marca como `cancelled` as reservas cujo e-mail de cancelamento chegou.
 * É idempotente: reservas já canceladas (ou que nunca foram importadas)
 * só entram como ignoradas, então rodar o sync de novo não muda nada.
 */
async function cancelReservationsFromEmails(
  gmail: gmail_v1.Gmail,
  result: SyncResult,
): Promise<void> {
  for (const emailId of await listMessageIds(gmail, CANCELLATION_QUERY)) {
    try {
      const { subject, body } = await fetchEmail(gmail, emailId)
      const { confirmation_code } = parseCancellationEmail(body ?? '', subject)
      const cancellation = await cancelReservationByConfirmationCode(confirmation_code)

      if (cancellation.outcome === 'not_found') {
        result.skipped++
        result.skippedItems.push({
          emailId,
          subject,
          confirmationCode: confirmation_code,
          reason: 'Cancelamento sem reserva importada',
        })
        continue
      }

      const guestName = [
        cancellation.reservation.guest_first_name,
        cancellation.reservation.guest_last_name,
      ]
        .filter(Boolean)
        .join(' ')

      if (cancellation.outcome === 'already_cancelled') {
        result.skipped++
        result.skippedItems.push({
          emailId,
          subject,
          guestName,
          confirmationCode: confirmation_code,
          reason: 'Já cancelada',
        })
        continue
      }

      result.cancelled++
      result.cancelledItems.push({
        emailId,
        subject,
        guestName,
        confirmationCode: confirmation_code,
      })
    } catch (err) {
      result.errors.push({ emailId, reason: describeError(err) })
    }
  }
}

export async function syncGmailReservations(): Promise<SyncResult> {
  const client = createGoogleOAuthClient()
  await loadGoogleToken(client)

  const googleEmail = await getAuthenticatedGmailAddress(client)
  if (googleEmail !== getAllowedSyncEmail()) {
    throw new Error('Token Google autorizado para um email diferente do permitido')
  }

  const gmail  = google.gmail({ version: 'v1', auth: client })
  const result: SyncResult = {
    imported: 0,
    skipped: 0,
    cancelled: 0,
    importedItems: [],
    skippedItems: [],
    cancelledItems: [],
    errors: [],
  }

  // A importação vem primeiro: assim um cancelamento que chegou no mesmo
  // ciclo já encontra a reserva criada e a cancela na mesma rodada.
  await importConfirmedReservations(gmail, result)
  await cancelReservationsFromEmails(gmail, result)

  return result
}
