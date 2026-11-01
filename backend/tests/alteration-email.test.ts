import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findAlterationRequest,
  parseAlterationAcceptedEmail,
  parseAlterationRequestEmail,
  parseDateRange,
} from '../src/services/gmail.service'
import type { AlterationRequest } from '../src/types'

// Corpos reais (resumidos) dos e-mails de alteração do Airbnb. O link com o
// código fica no href, por isso o fixture mantém o HTML.
const ACCEPTED_EDUARDO = `
  <h1>Your reservation with Eduardo has been updated</h1>
  <a href="https://www.airbnb.com/hosting/reservations/details/HMK95EPSFN?c=.pi80.pkQUxURVJBVElPTl9BQ0NFUFRFRA%3D%3D">Eduardo</a>
  <p>Recife, Brazil</p><p>Apê dos sonhos em Ponta Negra</p>
  <p>We&#39;ve already updated the reservation itinerary. If you have questions, send Eduardo a message.</p>
  <a href="https://www.airbnb.com/hosting/reservations/details/HMK95EPSFN?c=x">Go to itinerary</a>
`

const ACCEPTED_ANDRE = `
  <h1>YOUR RESERVATION WITH ANDRÉ HAS BEEN UPDATED</h1>
  <p>ANDRÉ</p><p>Brazil</p>
  <a href="https://www.airbnb.com/hosting/reservations/details/HMCRW3C395?c=.pi80.pkcmVzZXJ2YXRpb24vYWx0ZXJhdGlvbi9BbHRlcmF0aW9uQWNjZXB0ZWRUZW1wbGF0ZQ%3D%3D">Go to itinerary</a>
`

const REQUEST_EDUARDO = `
  <h1>Eduardo wants to change their reservation</h1>
  <p>Eduardo</p><p>Natal</p><p>Apê dos sonhos em Ponta Negra</p>
  <h3>Original Dates</h3><p>Nov 14, 2026 - Nov 21, 2026</p>
  <h3>Requested Dates</h3><p>Feb 12, 2027 - Feb 17, 2027</p>
  <p>If you accept Eduardo’s request, we’ll immediately update the reservation.</p>
  <a href="https://www.airbnb.com/reservation/alteration/1801717987864038973">Go to request</a>
`

const REQUEST_ANDRE = `
  <h1>André wants to change their reservation</h1>
  <p>André</p><p>Natal</p>
  <h3>Original Guests</h3><p>1 guest</p>
  <h3>Requested Guests</h3><p>4 guests</p>
  <p>If you accept André&#39;s request, we&#39;ll immediately update the reservation.</p>
`

// ─── Aceite ("Reservation updated") ───────────────────────────────────────────

test('aceite: extrai código e nome do e-mail real', () => {
  const parsed = parseAlterationAcceptedEmail(ACCEPTED_EDUARDO, 'Reservation updated')
  assert.equal(parsed.confirmation_code, 'HMK95EPSFN')
  assert.equal(parsed.guestFirstName, 'Eduardo')
})

test('aceite: nome em maiúsculas com acento', () => {
  const parsed = parseAlterationAcceptedEmail(ACCEPTED_ANDRE, 'Reservation updated')
  assert.equal(parsed.confirmation_code, 'HMCRW3C395')
  assert.equal(parsed.guestFirstName, 'André')
})

test('aceite: sem link do painel lança erro', () => {
  assert.throws(
    () => parseAlterationAcceptedEmail('<p>Your reservation with Eduardo has been updated</p>', 'Reservation updated'),
    /Código de confirmação não encontrado no email de alteração/,
  )
})

// ─── Pedido ("wants to change their reservation") ─────────────────────────────

test('pedido: mudança de datas', () => {
  const parsed = parseAlterationRequestEmail(REQUEST_EDUARDO, 'Eduardo wants to change their reservation')
  assert.equal(parsed.guestFirstName, 'Eduardo')
  assert.deepEqual(parsed.original, { checkin_at: '2026-11-14', checkout_at: '2026-11-21' })
  assert.deepEqual(parsed.requested, { checkin_at: '2027-02-12', checkout_at: '2027-02-17' })
})

test('pedido: mudança de hóspedes', () => {
  const parsed = parseAlterationRequestEmail(REQUEST_ANDRE, 'André wants to change their reservation')
  assert.equal(parsed.guestFirstName, 'André')
  assert.deepEqual(parsed.original, { guests_count: 1 })
  assert.deepEqual(parsed.requested, { guests_count: 4 })
})

test('pedido: datas e hóspedes no mesmo e-mail', () => {
  const body = `${REQUEST_EDUARDO} <h3>Original Guests</h3><p>2 guests</p><h3>Requested Guests</h3><p>3 guests</p>`
  const parsed = parseAlterationRequestEmail(body, 'Eduardo wants to change their reservation')
  assert.deepEqual(parsed.requested, { checkin_at: '2027-02-12', checkout_at: '2027-02-17', guests_count: 3 })
})

test('pedido: sem seção reconhecível lança erro', () => {
  assert.throws(
    () => parseAlterationRequestEmail('<p>Eduardo wants to change the price</p>', 'Eduardo wants to change their reservation'),
    /sem datas nem hóspedes/,
  )
})

test('pedido: assunto fora do formato lança erro', () => {
  assert.throws(() => parseAlterationRequestEmail(REQUEST_EDUARDO, 'Reservation updated'), /Nome do hóspede/)
})

test('intervalo de datas: formatos do Airbnb', () => {
  assert.deepEqual(parseDateRange('Nov 14, 2026 - Nov 21, 2026'), { checkin_at: '2026-11-14', checkout_at: '2026-11-21' })
  assert.deepEqual(parseDateRange('Nov 14 – 21, 2026'), { checkin_at: '2026-11-14', checkout_at: '2026-11-21' })
  assert.deepEqual(parseDateRange('Dec 30, 2026 – Jan 3, 2027'), { checkin_at: '2026-12-30', checkout_at: '2027-01-03' })
  assert.deepEqual(parseDateRange('Dec 30 – Jan 3, 2027'), { checkin_at: '2026-12-30', checkout_at: '2027-01-03' })
  assert.deepEqual(parseDateRange('Nov 14, 2026 &ndash; Nov 21, 2026'), { checkin_at: '2026-11-14', checkout_at: '2026-11-21' })
})

// ─── Casamento aceite ↔ pedido ────────────────────────────────────────────────

function request(guestFirstName: string, receivedAt: string, emailId = guestFirstName): AlterationRequest {
  return {
    emailId,
    guestFirstName,
    receivedAt: new Date(receivedAt),
    original: { guests_count: 1 },
    requested: { guests_count: 2 },
  }
}

test('casamento: pedido e aceite da mesma noite', () => {
  const requests = [request('Eduardo', '2026-10-21T21:32:01Z')]
  const found = findAlterationRequest(requests, 'Eduardo', new Date('2026-10-21T22:41:44Z'))
  assert.equal(found?.guestFirstName, 'Eduardo')
})

test('casamento: pedido de outro hóspede no meio', () => {
  const requests = [
    request('Eduardo', '2026-10-21T21:32:01Z'),
    request('Maria', '2026-10-21T22:00:00Z'),
  ]
  const found = findAlterationRequest(requests, 'Eduardo', new Date('2026-10-21T22:41:44Z'))
  assert.equal(found?.guestFirstName, 'Eduardo')
})

test('casamento: usa o pedido mais recente antes do aceite e ignora os posteriores', () => {
  const requests = [
    request('Eduardo', '2026-10-01T10:00:00Z', 'antigo'),
    request('Eduardo', '2026-10-21T21:32:01Z', 'recente'),
    request('Eduardo', '2026-10-25T10:00:00Z', 'depois'),
  ]
  const found = findAlterationRequest(requests, 'Eduardo', new Date('2026-10-21T22:41:44Z'))
  assert.equal(found?.emailId, 'recente')
})

test('casamento: ignora acento e caixa no nome', () => {
  const requests = [request('André', '2026-08-03T23:29:46Z')]
  const found = findAlterationRequest(requests, 'ANDRE', new Date('2026-08-03T23:31:10Z'))
  assert.equal(found?.guestFirstName, 'André')
})

test('casamento: aceite sem pedido', () => {
  const requests = [request('Maria', '2026-10-21T21:00:00Z')]
  assert.equal(findAlterationRequest(requests, 'Eduardo', new Date('2026-10-21T22:41:44Z')), undefined)
})
