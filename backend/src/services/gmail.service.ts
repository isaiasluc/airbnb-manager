import { google, type gmail_v1 } from 'googleapis'
import type { AlterationRequest, AlterationValues, CreateReservationInput } from '../types'
import {
  findReservationByConfirmationCode,
  reservationExistsByEmailId,
} from '../repositories/reservation.repository'
import {
  applyReservationAlteration,
  cancelReservationByConfirmationCode,
  createReservation,
} from './reservation.service'
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

// ─── Alterações de reserva ────────────────────────────────────────────────────
//
// Cada alteração aceita gera dois e-mails, cada um com metade da informação:
// - pedido  "<Nome> wants to change their reservation": valores originais e
//   pedidos (datas e/ou hóspedes), mas SEM o código de confirmação;
// - aceite  "Reservation updated": só o código (no link do painel do host) e
//   o nome do hóspede, sem nenhum valor.
// Nenhum dos dois traz o payout novo.

const reservationDetailsLinkPattern = /hosting\/reservations\/details\/([a-z0-9]{8,12})\b/i
const alterationAcceptedNamePattern = /your reservation with\s+(.+?)\s+has been updated/i
const alterationRequestSubjectPattern = /^(.+?)\s+wants to change (?:their|his|her) reservation/i

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

const rangeSeparator = String.raw`\s*(?:-|–|—|&ndash;|&mdash;|to)\s*`
// "Nov 14, 2026 - Nov 21, 2026", "Nov 14 – 21, 2026", "Dec 30, 2026 – Jan 3, 2027"
const dateRangePattern =
  String.raw`([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:,\s*(\d{4}))?` +
  rangeSeparator +
  String.raw`(?:([A-Za-z]{3,9})\.?\s+)?(\d{1,2}),\s*(\d{4})`

/** Primeira letra maiúscula, resto minúsculo: "ANDRÉ" → "André". */
function capitalizeName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toLocaleUpperCase('pt-BR'))
}

function toDateOnlyString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthNumber(name: string): number {
  const month = MONTHS[name.slice(0, 3).toLowerCase()]
  if (!month) throw new Error(`Mês inválido no email de alteração: ${name}`)
  return month
}

/** Converte um intervalo de datas do Airbnb em `checkin_at`/`checkout_at` ('YYYY-MM-DD'). */
export function parseDateRange(raw: string): { checkin_at: string; checkout_at: string } {
  const match = raw.match(new RegExp(dateRangePattern, 'i'))
  if (!match) throw new Error(`Intervalo de datas inválido: ${raw}`)

  const [, startMonthName, startDay, startYearRaw, endMonthName, endDay, endYearRaw] = match
  const startMonth = monthNumber(startMonthName)
  const endMonth = endMonthName ? monthNumber(endMonthName) : startMonth
  const endYear = Number(endYearRaw)
  // Sem ano no início ("Dec 30 – Jan 3, 2027"), o início é no ano anterior se o mês virou.
  const startYear = startYearRaw
    ? Number(startYearRaw)
    : startMonth > endMonth ? endYear - 1 : endYear

  return {
    checkin_at: toDateOnlyString(startYear, startMonth, Number(startDay)),
    checkout_at: toDateOnlyString(endYear, endMonth, Number(endDay)),
  }
}

/**
 * Extrai o código de confirmação e o primeiro nome do hóspede do e-mail
 * "Reservation updated" (alteração aceita). O código vem do link do painel do
 * host — procurado no corpo cru, porque o link fica no `href` e some quando as
 * tags HTML são removidas.
 */
export function parseAlterationAcceptedEmail(
  rawBody: string,
  _subject: string,
): { confirmation_code: string; guestFirstName?: string } {
  const codeMatch = rawBody.match(reservationDetailsLinkPattern)
  if (!codeMatch) throw new Error('Código de confirmação não encontrado no email de alteração')

  const nameMatch = extractText(rawBody).match(alterationAcceptedNamePattern)

  return {
    confirmation_code: codeMatch[1].toUpperCase(),
    guestFirstName: nameMatch ? capitalizeName(nameMatch[1]) : undefined,
  }
}

/**
 * Extrai o pedido de alteração ("<Nome> wants to change their reservation"):
 * datas e/ou número de hóspedes, originais e pedidos. Cada seção é opcional,
 * mas o pedido precisa ter ao menos uma.
 */
export function parseAlterationRequestEmail(
  rawBody: string,
  subject: string,
): Omit<AlterationRequest, 'emailId' | 'receivedAt'> {
  const nameMatch = subject.match(alterationRequestSubjectPattern)
  if (!nameMatch) throw new Error('Nome do hóspede não encontrado no assunto do pedido de alteração')

  const text = extractText(rawBody)
  const original: AlterationValues = {}
  const requested: AlterationValues = {}

  const originalDates = text.match(new RegExp(`Original Dates\\s+(${dateRangePattern})`, 'i'))
  const requestedDates = text.match(new RegExp(`Requested Dates\\s+(${dateRangePattern})`, 'i'))
  if (originalDates && requestedDates) {
    Object.assign(original, parseDateRange(originalDates[1]))
    Object.assign(requested, parseDateRange(requestedDates[1]))
  }

  const originalGuests = text.match(/Original Guests\s+(\d+)\s+guests?/i)
  const requestedGuests = text.match(/Requested Guests\s+(\d+)\s+guests?/i)
  if (originalGuests && requestedGuests) {
    original.guests_count = Number(originalGuests[1])
    requested.guests_count = Number(requestedGuests[1])
  }

  if (Object.keys(requested).length === 0) {
    throw new Error('Pedido de alteração sem datas nem hóspedes reconhecíveis')
  }

  return { guestFirstName: capitalizeName(nameMatch[1]), original, requested }
}

/** Nome comparável: sem acento, minúsculo, sem espaços nas pontas. */
export function normalizeGuestName(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
}

/**
 * Mesmo hóspede pelo primeiro nome. O Airbnb às vezes usa o nome composto
 * ("Thais Luiza wants to change…") enquanto a reserva guarda só o primeiro
 * ("Thais"), então compara só a primeira palavra.
 */
export function isSameGuestFirstName(a: string, b: string): boolean {
  const firstWord = (name: string) => normalizeGuestName(name).split(/\s+/)[0]
  return firstWord(a) !== '' && firstWord(a) === firstWord(b)
}

/**
 * Pedido de alteração que corresponde a um aceite: o mais recente do mesmo
 * hóspede (primeiro nome, sem acento/caixa) recebido até o aceite.
 */
export function findAlterationRequest(
  requests: AlterationRequest[],
  guestFirstName: string,
  acceptedAt: Date,
): AlterationRequest | undefined {
  return requests
    .filter((request) =>
      isSameGuestFirstName(request.guestFirstName, guestFirstName)
      && request.receivedAt.getTime() <= acceptedAt.getTime()
    )
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())[0]
}

// ─── Sync principal ───────────────────────────────────────────────────────────

const CONFIRMATION_QUERY = 'from:automated@airbnb.com subject:"Reservation confirmed"'
// O Airbnb usa "Canceled" (en-US); aceitamos as duas grafias por segurança.
const CANCELLATION_QUERY =
  'from:automated@airbnb.com subject:Reservation (subject:canceled OR subject:cancelled)'
// Alteração: aceite (só o código) + pedido (só os valores) — ver parsers acima.
const ALTERATION_ACCEPTED_QUERY = 'from:automated@airbnb.com subject:"Reservation updated"'
const ALTERATION_REQUEST_QUERY = 'from:automated@airbnb.com subject:"wants to change"'

export interface SyncResult {
  imported: number
  skipped:  number
  cancelled: number
  importedItems: SyncItem[]
  skippedItems:  SyncItem[]
  cancelledItems: SyncItem[]
  updated: number
  updatedItems: SyncItem[]
  errors:   { emailId: string; reason: string }[]
}

export interface SyncItem {
  emailId: string
  subject: string
  guestName?: string
  confirmationCode?: string
  reason?: string
  /** Campos alterados por um e-mail de alteração (só em `updatedItems`). */
  changedFields?: string[]
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

/** Cota por minuto da Gmail API estourada (429 / rateLimitExceeded / "Quota exceeded"). */
export function isGmailRateLimitError(err: unknown): boolean {
  const error = err as { code?: number | string; status?: number; message?: string }
  return error?.code === 429
    || error?.status === 429
    || /quota exceeded|rate ?limit/i.test(error?.message ?? '')
}

const RATE_LIMIT_RETRY_DELAYS_MS = [5_000, 15_000, 45_000]

/**
 * A cota da Gmail API é por minuto: com três passos lendo e-mails na mesma
 * rodada, ela pode estourar. Espera e tenta de novo em vez de perder o item.
 */
async function withRateLimitRetry<T>(call: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call()
    } catch (err) {
      const delay = RATE_LIMIT_RETRY_DELAYS_MS[attempt]
      if (delay === undefined || !isGmailRateLimitError(err)) throw err
      console.warn(`[gmail-sync] Cota da Gmail API estourada; nova tentativa em ${delay / 1000}s`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

async function fetchEmail(gmail: gmail_v1.Gmail, emailId: string): Promise<EmailContent> {
  const full = await withRateLimitRetry(() => gmail.users.messages.get({
    userId: 'me',
    id: emailId,
    format: 'full',
  }))

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

/** Lê todos os pedidos de alteração uma vez por rodada; pedido ilegível vira erro do item. */
async function loadAlterationRequests(
  gmail: gmail_v1.Gmail,
  result: SyncResult,
): Promise<AlterationRequest[]> {
  const requests: AlterationRequest[] = []

  for (const emailId of await listMessageIds(gmail, ALTERATION_REQUEST_QUERY)) {
    try {
      const { subject, body, receivedAt } = await fetchEmail(gmail, emailId)
      requests.push({ ...parseAlterationRequestEmail(body ?? '', subject), emailId, receivedAt })
    } catch (err) {
      result.errors.push({ emailId, reason: describeError(err) })
    }
  }

  return requests
}

function guestNameOf(reservation: { guest_first_name: string; guest_last_name: string }): string {
  return [reservation.guest_first_name, reservation.guest_last_name].filter(Boolean).join(' ')
}

/**
 * Aplica as alterações aceitas ("Reservation updated") com os valores do
 * pedido correspondente. Os aceites vão do mais antigo para o mais novo, para
 * alterações em sequência da mesma reserva chegarem ao estado final. É
 * idempotente: aceite já processado ou já refletido na reserva só é ignorado.
 */
async function applyReservationAlterationsFromEmails(
  gmail: gmail_v1.Gmail,
  result: SyncResult,
): Promise<void> {
  const acceptedIds = await listMessageIds(gmail, ALTERATION_ACCEPTED_QUERY)
  if (acceptedIds.length === 0) return

  const requests = await loadAlterationRequests(gmail, result)
  const accepted: (EmailContent & { emailId: string })[] = []

  for (const emailId of acceptedIds) {
    try {
      accepted.push({ ...(await fetchEmail(gmail, emailId)), emailId })
    } catch (err) {
      result.errors.push({ emailId, reason: describeError(err) })
    }
  }

  accepted.sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())

  for (const { emailId, subject, body, receivedAt } of accepted) {
    try {
      const { confirmation_code, guestFirstName } = parseAlterationAcceptedEmail(body ?? '', subject)
      const item: SyncItem = { emailId, subject, confirmationCode: confirmation_code }

      const reservation = await findReservationByConfirmationCode(confirmation_code)
      if (!reservation) {
        result.skipped++
        result.skippedItems.push({ ...item, guestName: guestFirstName, reason: 'Alteração sem reserva importada' })
        continue
      }

      // O nome do aceite precisa ser o da reserva; sem nome no aceite, vale o da reserva.
      const name = guestFirstName ?? reservation.guest_first_name
      if (!isSameGuestFirstName(name, reservation.guest_first_name)) {
        result.errors.push({
          emailId,
          reason: `Hóspede do aceite (${name}) não confere com a reserva ${confirmation_code} (${reservation.guest_first_name})`,
        })
        continue
      }

      const request = findAlterationRequest(requests, name, receivedAt)
      if (!request) {
        result.errors.push({ emailId, reason: `Pedido de alteração não encontrado para ${confirmation_code}` })
        continue
      }

      const alteration = await applyReservationAlteration(confirmation_code, request, receivedAt)

      switch (alteration.outcome) {
        case 'not_found':
          result.skipped++
          result.skippedItems.push({ ...item, guestName: name, reason: 'Alteração sem reserva importada' })
          break
        case 'cancelled':
          result.skipped++
          result.skippedItems.push({ ...item, guestName: guestNameOf(alteration.reservation), reason: 'Reserva cancelada' })
          break
        case 'already_applied':
          result.skipped++
          result.skippedItems.push({ ...item, guestName: guestNameOf(alteration.reservation), reason: 'Já atualizada' })
          break
        case 'mismatch':
          result.errors.push({ emailId, reason: `Pedido de alteração não confere com a reserva ${confirmation_code}` })
          break
        case 'updated':
          result.updated++
          result.updatedItems.push({
            ...item,
            guestName: guestNameOf(alteration.reservation),
            changedFields: alteration.changedFields,
          })
          break
      }
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
    updated: 0,
    updatedItems: [],
    errors: [],
  }

  // A importação vem primeiro: assim um cancelamento que chegou no mesmo
  // ciclo já encontra a reserva criada e a cancela na mesma rodada.
  await importConfirmedReservations(gmail, result)
  await cancelReservationsFromEmails(gmail, result)
  // Alterações por último: a reserva já existe (mesmo se confirmada neste
  // ciclo) e uma reserva cancelada nesta rodada não é mexida.
  await applyReservationAlterationsFromEmails(gmail, result)

  return result
}
