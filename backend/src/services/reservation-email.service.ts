import nodemailer from 'nodemailer'
import type { ReservationWithGuest } from '../types'

const DEFAULT_APARTMENT = '1203'

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

function createTransporter() {
  const port = Number(process.env.SMTP_PORT ?? 587)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465

  return nodemailer.createTransport({
    host: requireEnv('SMTP_HOST'),
    port,
    secure,
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS'),
    },
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
  const from = process.env.SMTP_FROM ?? requireEnv('SMTP_USER')
  const transporter = createTransporter()

  await transporter.sendMail({
    from,
    to,
    subject: `Nova hospedagem - ${getGuestName(reservation)}`,
    text: buildCheckinEmailText(reservation),
  })
}
