import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldCancelHostService } from '../src/services/reservation.service'

test('cancelar a reserva cancela a taxa de serviço do host', () => {
  assert.equal(shouldCancelHostService({ status: 'cancelled' }), true)
})

test('um host_service_status explícito tem prioridade', () => {
  assert.equal(
    shouldCancelHostService({ status: 'cancelled', host_service_status: 'paid' }),
    false,
  )
})

test('outros status não mexem na taxa de serviço', () => {
  assert.equal(shouldCancelHostService({ status: 'completed' }), false)
  assert.equal(shouldCancelHostService({ status: 'in_progress' }), false)
  assert.equal(shouldCancelHostService({ status: 'confirmed' }), false)
})

test('update que não mexe no status não mexe na taxa de serviço', () => {
  assert.equal(shouldCancelHostService({ guests_count: 3 }), false)
  assert.equal(shouldCancelHostService({}), false)
})
