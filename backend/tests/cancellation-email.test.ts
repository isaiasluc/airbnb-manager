import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCancellationEmail } from '../src/services/gmail.service'

// Corpo real (resumido) do e-mail "Canceled: Reservation ..." do Airbnb.
const BODY = `
  RESERVATION CANCELED

  https://www.airbnb.com/hosting/reservations/details/HMXXXQTZKC?email_cta=link_canceled_reservation_by_guest

  Unfortunately, your guest Cristian had to cancel reservation
  HMXXXQTZKC for Nov 17 &ndash; 24. Your calendar has been updated
  to show that these dates are now available.
`

test('extrai o código do assunto', () => {
  const parsed = parseCancellationEmail(
    BODY,
    'Canceled: Reservation HMXXXQTZKC for Nov 17 – 24, 2026',
  )
  assert.equal(parsed.confirmation_code, 'HMXXXQTZKC')
})

test('aceita a grafia "Cancelled"', () => {
  const parsed = parseCancellationEmail(
    BODY,
    'Cancelled: Reservation HMY8P5CXYS for Feb 27 – Mar 2, 2026',
  )
  assert.equal(parsed.confirmation_code, 'HMY8P5CXYS')
})

test('cai para o corpo quando o assunto não traz o código', () => {
  const parsed = parseCancellationEmail(BODY, 'Reservation canceled')
  assert.equal(parsed.confirmation_code, 'HMXXXQTZKC')
})

test('normaliza o código para maiúsculas', () => {
  const parsed = parseCancellationEmail('', 'Canceled: Reservation hmxxxqtzkc for Nov 17 – 24, 2026')
  assert.equal(parsed.confirmation_code, 'HMXXXQTZKC')
})

test('falha quando não há código em lugar nenhum', () => {
  assert.throws(
    () => parseCancellationEmail('conteúdo sem código', 'Canceled: Reservation'),
    /Código de confirmação não encontrado/,
  )
})
