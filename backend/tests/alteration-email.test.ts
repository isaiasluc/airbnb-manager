import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createRateLimitBudget,
  isGmailRateLimitError,
  isSameGuestFirstName,
  nextRateLimitDelay,
  selectAlterationRequest,
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

// Reserva com 2 hóspedes e 14–21/11/2026, como o pg devolve (DATE à meia-noite).
const reservation = {
  checkin_at: new Date('2026-11-14T00:00:00.000Z'),
  checkout_at: new Date('2026-11-21T00:00:00.000Z'),
  guests_count: 2,
  last_alteration_at: null,
}

function request(
  guestFirstName: string,
  receivedAt: string,
  options: Partial<Pick<AlterationRequest, 'emailId' | 'original' | 'requested'>> = {},
): AlterationRequest {
  return {
    emailId: options.emailId ?? `${guestFirstName}-${receivedAt}`,
    guestFirstName,
    receivedAt: new Date(receivedAt),
    original: options.original ?? { checkin_at: '2026-11-14', checkout_at: '2026-11-21' },
    requested: options.requested ?? { checkin_at: '2027-02-12', checkout_at: '2027-02-17' },
  }
}

function select(requests: AlterationRequest[], acceptedAt: string, extra: Partial<Parameters<typeof selectAlterationRequest>[1]> = {}) {
  return selectAlterationRequest(requests, {
    guestFirstName: 'Eduardo',
    acceptedAt: new Date(acceptedAt),
    reservation,
    ...extra,
  })
}

test('casamento: pedido e aceite da mesma noite', () => {
  const eduardo = request('Eduardo', '2026-10-21T21:32:01Z')
  assert.deepEqual(select([eduardo], '2026-10-21T22:41:44Z'), { outcome: 'found', request: eduardo })
})

test('casamento: pedido de outro hóspede no meio', () => {
  const eduardo = request('Eduardo', '2026-10-21T21:32:01Z')
  const maria = request('Maria', '2026-10-21T22:00:00Z')
  assert.deepEqual(select([eduardo, maria], '2026-10-21T22:41:44Z'), { outcome: 'found', request: eduardo })
})

test('casamento: ignora pedidos depois do aceite e fora da janela de 7 dias', () => {
  const old = request('Eduardo', '2026-10-01T10:00:00Z')
  const later = request('Eduardo', '2026-10-25T10:00:00Z')
  assert.deepEqual(select([old, later], '2026-10-21T22:41:44Z'), { outcome: 'not_found' })
})

test('casamento: ignora pedidos anteriores à última alteração aplicada', () => {
  const eduardo = request('Eduardo', '2026-10-21T21:32:01Z')
  const result = select([eduardo], '2026-10-23T10:00:00Z', {
    reservation: { ...reservation, last_alteration_at: new Date('2026-10-21T22:41:44Z') },
  })
  assert.deepEqual(result, { outcome: 'not_found' })
})

test('casamento: pedido já usado nesta rodada não serve para outro aceite', () => {
  const eduardo = request('Eduardo', '2026-10-21T21:32:01Z', { emailId: 'p1' })
  const result = select([eduardo], '2026-10-21T22:41:44Z', { consumedEmailIds: new Set(['p1']) })
  assert.deepEqual(result, { outcome: 'not_found' })
})

test('casamento: homônimos com pedidos diferentes que conferem viram ambíguo', () => {
  // João de R1 pede datas; outro João (R2) pede 2 → 4 hóspedes depois.
  const dates = request('Eduardo', '2026-10-21T10:00:00Z')
  const guests = request('Eduardo', '2026-10-21T11:00:00Z', {
    original: { guests_count: 2 },
    requested: { guests_count: 4 },
  })
  assert.deepEqual(select([dates, guests], '2026-10-21T12:00:00Z'), { outcome: 'ambiguous', count: 2 })
})

test('casamento: pedido mais novo que não confere cai para o que confere', () => {
  const ok = request('Eduardo', '2026-10-21T10:00:00Z')
  const other = request('Eduardo', '2026-10-21T11:00:00Z', {
    original: { checkin_at: '2026-12-01', checkout_at: '2026-12-05' },
    requested: { checkin_at: '2026-12-02', checkout_at: '2026-12-06' },
  })
  assert.deepEqual(select([ok, other], '2026-10-21T12:00:00Z'), { outcome: 'found', request: ok })
})

test('casamento: nenhum candidato confere com a reserva', () => {
  const other = request('Eduardo', '2026-10-21T11:00:00Z', {
    original: { checkin_at: '2026-12-01', checkout_at: '2026-12-05' },
  })
  assert.deepEqual(select([other], '2026-10-21T12:00:00Z'), { outcome: 'mismatch' })
})

test('casamento: e-mail de pedido duplicado não é ambíguo', () => {
  const first = request('Eduardo', '2026-10-21T21:00:00Z', { emailId: 'a' })
  const copy = request('Eduardo', '2026-10-21T21:30:00Z', { emailId: 'b' })
  assert.deepEqual(select([first, copy], '2026-10-21T22:41:44Z'), { outcome: 'found', request: copy })
})

test('casamento: ignora acento e caixa no nome', () => {
  const andre = request('André', '2026-08-03T23:29:46Z')
  assert.equal(select([andre], '2026-08-03T23:31:10Z', { guestFirstName: 'ANDRE' }).outcome, 'found')
})

test('casamento: nome composto do Airbnb casa com o primeiro nome da reserva', () => {
  assert.equal(isSameGuestFirstName('Thais Luiza', 'Thais'), true)
  assert.equal(isSameGuestFirstName('Thaís', 'THAIS luiza'), true)
  assert.equal(isSameGuestFirstName('Thais', 'Thiago'), false)
  assert.equal(isSameGuestFirstName('', ''), false)

  const thais = request('Thais Luiza', '2024-09-05T10:00:00Z')
  assert.equal(select([thais], '2024-09-05T12:00:00Z', { guestFirstName: 'Thais' }).outcome, 'found')
})

test('casamento: aceite sem pedido', () => {
  const maria = request('Maria', '2026-10-21T21:00:00Z')
  assert.deepEqual(select([maria], '2026-10-21T22:41:44Z'), { outcome: 'not_found' })
})

// ─── Cota da Gmail API ────────────────────────────────────────────────────────

test('reconhece estouro de cota da Gmail API', () => {
  assert.equal(isGmailRateLimitError({ code: 429 }), true)
  assert.equal(
    isGmailRateLimitError(new Error("Quota exceeded for quota metric 'Total Query Cost' and limit 'Units per minute per user'")),
    true,
  )
  assert.equal(isGmailRateLimitError(new Error('invalid_grant')), false)
  assert.equal(isGmailRateLimitError({ code: 404 }), false)
})

test('orçamento de espera da cota acaba e passa a falhar na hora', () => {
  const budget = createRateLimitBudget()
  assert.equal(nextRateLimitDelay(budget, 0), 5_000)
  budget.waitedMs = 110_000
  assert.equal(nextRateLimitDelay(budget, 1), null) // 110s + 15s > 120s
  assert.equal(budget.exhausted, true)
  // Esgotado na rodada: até a primeira tentativa de outro e-mail desiste.
  assert.equal(nextRateLimitDelay(budget, 0), null)
})

test('sem mais tentativas para o mesmo e-mail', () => {
  assert.equal(nextRateLimitDelay(createRateLimitBudget(), 3), null)
})
