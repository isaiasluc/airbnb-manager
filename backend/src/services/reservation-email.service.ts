import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import type { ReservationWithGuest } from '../types'
import { createGoogleOAuthClient, getAuthenticatedGmailAddress, loadGoogleToken } from './google-auth.service'
import { getAllowedSyncEmail } from '../middlewares/require-sync-email'

const DEFAULT_APARTMENT = '1203'
const SENDER_NAME = 'Isaias Lucena'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variável de ambiente ${name} não configurada`)
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
  html: string
}): Promise<string> {
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  })

  const info = await transporter.sendMail(input)
  const message = (info as { message?: Buffer | string }).message

  if (!message) {
    throw new Error('Não foi possível gerar a mensagem de email')
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
  html: string
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

function buildCheckinEmailHtml(reservation: ReservationWithGuest): string {
  const apartment = process.env.RESERVATION_APARTMENT ?? DEFAULT_APARTMENT
  const guestName = getGuestName(reservation)
  const checkin = formatDateOnly(reservation.checkin_at)
  const checkout = formatDateOnly(reservation.checkout_at)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #222; line-height: 1.6;">
  <p>Prezados,</p>
  <p>Solicito a liberação de acesso para o hóspede abaixo:</p>
  <table style="border-collapse: collapse; margin: 8px 0;">
    <tr>
      <td style="padding: 4px 12px 4px 0; font-weight: bold;">Nome</td>
      <td style="padding: 4px 0;">${guestName}</td>
    </tr>
    <tr>
      <td style="padding: 4px 12px 4px 0; font-weight: bold;">Apartamento</td>
      <td style="padding: 4px 0;">${apartment}</td>
    </tr>
    <tr>
      <td style="padding: 4px 12px 4px 0; font-weight: bold;">Check-in</td>
      <td style="padding: 4px 0;">${checkin}</td>
    </tr>
    <tr>
      <td style="padding: 4px 12px 4px 0; font-weight: bold;">Check-out</td>
      <td style="padding: 4px 0;">${checkout}</td>
    </tr>
  </table>
  <p>Atenciosamente,<br><strong>Isaias Lucena</strong></p>
</body>
</html>`
}

export async function sendCheckinEmail(reservation: ReservationWithGuest): Promise<void> {
  const to = requireEnv('RESERVATION_EMAIL_TO')
  const fromAddress = process.env.RESERVATION_EMAIL_FROM ?? getAllowedSyncEmail()
  const from = `${SENDER_NAME} <${fromAddress}>`

  await sendWithGmailApi({
    from,
    to,
    subject: `Liberação de acesso - Apto ${process.env.RESERVATION_APARTMENT ?? DEFAULT_APARTMENT} - ${getGuestName(reservation)}`,
    text: buildCheckinEmailText(reservation),
    html: buildCheckinEmailHtml(reservation),
  })
}
