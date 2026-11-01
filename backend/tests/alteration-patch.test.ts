import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAlterationPatch,
  calculateHostServiceFee,
  resolveAlterationSideEffects,
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
