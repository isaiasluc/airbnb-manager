import assert from 'node:assert/strict'
import test from 'node:test'
import {
  pickEditableReservationFields,
  validateReservationEdit,
} from '../src/services/reservation.service'

const current = {
  checkin_at: new Date('2027-02-12T00:00:00.000Z'),
  checkout_at: new Date('2027-02-17T00:00:00.000Z'),
}

test('PATCH descarta campos não editáveis', () => {
  const picked = pickEditableReservationFields({ guests_count: 3, confirmation_code: 'XXXX', guest_id: 99 })
  assert.deepEqual(picked, { guests_count: 3 })
})

test('PATCH com corpo inválido vira update vazio', () => {
  assert.deepEqual(pickEditableReservationFields(null), {})
  assert.deepEqual(pickEditableReservationFields('texto'), {})
})

test('edição válida de datas, hóspedes e payout', () => {
  assert.equal(
    validateReservationEdit({ checkin_at: '2027-02-13', checkout_at: '2027-02-18', guests_count: 4, host_payout: 1500 }, current),
    null,
  )
})

test('checkout antes do check-in', () => {
  assert.match(
    validateReservationEdit({ checkin_at: '2027-02-17', checkout_at: '2027-02-12' }, current) ?? '',
    /posterior/,
  )
})

test('checkout igual ao check-in (zero noites)', () => {
  assert.match(
    validateReservationEdit({ checkin_at: '2027-02-12', checkout_at: '2027-02-12' }, current) ?? '',
    /posterior/,
  )
})

test('só o checkout mudando valida contra o check-in gravado', () => {
  assert.match(validateReservationEdit({ checkout_at: '2027-02-11' }, current) ?? '', /posterior/)
  assert.equal(validateReservationEdit({ checkout_at: '2027-02-13' }, current), null)
})

test('data fora do formato ou inexistente', () => {
  assert.match(validateReservationEdit({ checkin_at: '12/02/2027' }, current) ?? '', /AAAA-MM-DD/)
  assert.match(validateReservationEdit({ checkin_at: '2027-02-30' }, current) ?? '', /AAAA-MM-DD/)
})

test('hóspedes e payout inválidos', () => {
  assert.match(validateReservationEdit({ guests_count: 0 }, current) ?? '', /guests_count/)
  assert.match(validateReservationEdit({ guests_count: 2.5 }, current) ?? '', /guests_count/)
  assert.match(validateReservationEdit({ host_payout: -1 }, current) ?? '', /host_payout/)
  assert.match(validateReservationEdit({ host_payout: '1500' as unknown as number }, current) ?? '', /host_payout/)
})

test('status e booleanos inválidos', () => {
  assert.match(validateReservationEdit({ status: 'paid' as never }, current) ?? '', /status/)
  assert.match(validateReservationEdit({ payout_needs_review: 'false' as never }, current) ?? '', /booleano/)
  assert.equal(validateReservationEdit({ status: 'cancelled', payout_needs_review: false }, current), null)
})
