import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAlterationPatch,
  calculateHostServiceFee,
  resolveAlterationSideEffects,
  resolveManualEditEmailReset,
  shouldClearPayoutReview,
} from '../src/services/reservation.service'

// Datas como o pg devolve uma coluna DATE (meia-noite).
const eduardo = {
  checkin_at: new Date('2026-11-14T00:00:00.000Z'),
  checkout_at: new Date('2026-11-21T00:00:00.000Z'),
  guests_count: 2,
}

const datesRequest = {
  original: { checkin_at: '2026-11-14', checkout_at: '2026-11-21' },
  requested: { checkin_at: '2027-02-12', checkout_at: '2027-02-17' },
}

test('datas alteradas entram no patch', () => {
  const result = buildAlterationPatch(eduardo, datesRequest)
  assert.deepEqual(result, {
    outcome: 'apply',
    patch: { checkin_at: '2027-02-12', checkout_at: '2027-02-17' },
    changedFields: ['checkin_at', 'checkout_at'],
  })
})

test('nova data recalcula a taxa: 12% a partir de 2026-02-08', () => {
  assert.equal(calculateHostServiceFee(2000, '2027-02-12'), 240)
})

test('nova data recalcula a taxa: volta a 10% antes de 2026-02-08', () => {
  assert.equal(calculateHostServiceFee(1000, '2026-02-10'), 120)
  assert.equal(calculateHostServiceFee(1000, '2026-02-05'), 100)
  assert.equal(calculateHostServiceFee(1000, '2026-02-08'), 120)
})

test('hóspedes alterados, datas mantidas', () => {
  const andre = { ...eduardo, guests_count: 1 }
  const result = buildAlterationPatch(andre, { original: { guests_count: 1 }, requested: { guests_count: 4 } })
  assert.deepEqual(result, { outcome: 'apply', patch: { guests_count: 4 }, changedFields: ['guests_count'] })
})

test('alteração já aplicada não gera patch', () => {
  const applied = {
    checkin_at: new Date('2027-02-12T00:00:00.000Z'),
    checkout_at: new Date('2027-02-17T00:00:00.000Z'),
    guests_count: 2,
  }
  assert.deepEqual(buildAlterationPatch(applied, datesRequest), { outcome: 'already_applied' })
})

test('pedido que não confere com a reserva', () => {
  const other = { ...eduardo, checkin_at: new Date('2026-11-15T00:00:00.000Z') }
  assert.deepEqual(buildAlterationPatch(other, datesRequest), { outcome: 'mismatch' })
})

test('só o checkout muda: patch leva só o checkout', () => {
  const result = buildAlterationPatch(eduardo, {
    original: { checkin_at: '2026-11-14', checkout_at: '2026-11-21' },
    requested: { checkin_at: '2026-11-14', checkout_at: '2026-11-23' },
  })
  assert.deepEqual(result, { outcome: 'apply', patch: { checkout_at: '2026-11-23' }, changedFields: ['checkout_at'] })
})

test('check-in mudou depois do e-mail enviado: e-mail volta a pendente', () => {
  const effects = resolveAlterationSideEffects(
    { checkin_at: eduardo.checkin_at, email_sent: true },
    { checkin_at: '2027-02-12', checkout_at: '2027-02-17' },
  )
  assert.deepEqual(effects, { payout_needs_review: true, email_sent: false })
})

test('só hóspedes mudam: e-mail de check-in continua enviado', () => {
  const effects = resolveAlterationSideEffects(
    { checkin_at: eduardo.checkin_at, email_sent: true },
    { guests_count: 4 },
  )
  assert.deepEqual(effects, { payout_needs_review: true })
})

test('check-in mudou com e-mail ainda não enviado: nada a resetar', () => {
  const effects = resolveAlterationSideEffects(
    { checkin_at: eduardo.checkin_at, email_sent: false },
    { checkin_at: '2027-02-12' },
  )
  assert.deepEqual(effects, { payout_needs_review: true })
})

test('ajustar o payout à mão limpa o aviso "conferir payout"', () => {
  assert.equal(shouldClearPayoutReview({ host_payout: 1500 }), true)
})

test('payout_needs_review explícito tem prioridade', () => {
  assert.equal(shouldClearPayoutReview({ host_payout: 1500, payout_needs_review: true }), false)
})

test('update sem payout não mexe no aviso', () => {
  assert.equal(shouldClearPayoutReview({ guests_count: 3 }), false)
})

test('seção repetida sem mudança no pedido não vira divergência', () => {
  // Hóspedes 2 → 2 junto com mudança de datas, mas a reserva tem 1 hóspede gravado.
  const result = buildAlterationPatch({ ...eduardo, guests_count: 1 }, {
    original: { ...datesRequest.original, guests_count: 2 },
    requested: { ...datesRequest.requested, guests_count: 2 },
  })
  assert.equal(result.outcome, 'apply')
})

test('edição manual do check-in volta o e-mail de check-in a pendente', () => {
  const current = { checkin_at: eduardo.checkin_at, email_sent: true }
  assert.deepEqual(resolveManualEditEmailReset(current, { checkin_at: '2026-11-15' }), { email_sent: false })
  assert.deepEqual(resolveManualEditEmailReset(current, { checkin_at: '2026-11-14' }), {})
  assert.deepEqual(resolveManualEditEmailReset(current, { checkout_at: '2026-11-22' }), {})
  assert.deepEqual(resolveManualEditEmailReset(current, { checkin_at: '2026-11-15', email_sent: true }), {})
})
