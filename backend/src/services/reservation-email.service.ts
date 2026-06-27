import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import type { ReservationWithGuest } from '../types'
import { createGoogleOAuthClient, getAuthenticatedGmailAddress, loadGoogleToken } from './google-auth.service'
import { getAllowedSyncEmail } from '../middlewares/require-sync-email'

const DEFAULT_APARTMENT = '1203'
const SENDER_NAME = 'Isaias Lucena'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Vari\u00e1vel de ambiente ${name} n\u00e3o configurada`)
  return value
}

function formatDateOnly(value: Date | string): string {
  if (typeof value === 'string') {
    const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
    if (dateOnly) {
      const [year, month, day] = dateOnly.split('-')
      return `${day}/${month}/${year}`
    }
  }

  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function getGuestName(reservation: ReservationWithGuest): string {
  return [reservation.guest_first_name, reservation.guest_last_name]
    .filter(Boolean)
    .join(' ')
}

async function buildRawEmail(input: {
  from: string
  to: string
  subject: string
  text: string
}): Promise<string> {
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  })

  const info = await transporter.sendMail(input)
  const message = (info as { message?: Buffer | string }).message

  if (!message) {
    throw new Error('N\u00e3o foi poss\u00edvel gerar a mensagem de email')
  }

  const raw = Buffer.isBuffer(message) ? message : Buffer.from(message)
  return raw
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function sendWithGmailApi(input: {
  from: string
  to: string
  subject: string
  text: string
}): Promise<void> {
  const client = createGoogleOAuthClient()
  loadGoogleToken(client)

  const googleEmail = await getAuthenticatedGmailAddress(client)
  if (googleEmail !== getAllowedSyncEmail()) {
    throw new Error('Token Google autorizado para um email diferente do permitido')
  }

  const raw = await buildRawEmail(input)
  const gmail = google.gmail({ version: 'v1', auth: client })

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  })
}

export function buildCheckinEmailText(reservation: ReservationWithGuest): string {
  const apartment = process.env.RESERVATION_APARTMENT ?? DEFAULT_APARTMENT

  return [
    'Prezados,',
    '',
    'Solicito a liberação de acesso para o hóspede abaixo:',
    '',
    `Nome: ${getGuestName(reservation)}`,
    `Apartamento: ${apartment}`,
    '',
    `Check-in: ${formatDateOnly(reservation.checkin_at)}`,
    `Check-out: ${formatDateOnly(reservation.checkout_at)}`,
    '',
    'Atenciosamente,',
    'Isaias Lucena',
  ].join('\n')
}

export async function sendCheckinEmail(reservation: ReservationWithGuest): Promise<void> {
  const to = requireEnv('RESERVATION_EMAIL_TO')
  const fromAddress = process.env.RESERVATION_EMAIL_FROM ?? getAllowedSyncEmail()
  const from = `${SENDER_NAME} <${fromAddress}>`
  const email = {
    from,
    to,
    subject: `Nova hospedagem - ${getGuestName(reservation)}`,
    text: buildCheckinEmailText(reservation),
  }

  await sendWithGmailApi(email)
}
