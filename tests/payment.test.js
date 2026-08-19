import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PAYMENT_METHODS,
  extractPaymentNo,
  mergePaymentStatus,
  normalizePaymentStatus,
} from '../src/utils/payment.js'

test('exposes numeric payment types required by the backend contract', () => {
  assert.deepEqual(PAYMENT_METHODS.map(({ value }) => value), [1, 2, 3])
  assert.ok(PAYMENT_METHODS.every(({ value }) => Number.isInteger(value)))
})

test('normalizes an order without a payment as unpaid', () => {
  assert.deepEqual(normalizePaymentStatus({ isPaid: false, payment: null }), {
    state: 'unpaid',
    title: '等待付款',
    description: '订单尚未支付，请选择支付方式完成付款。',
    isPaid: false,
    canPay: true,
    paymentNo: '',
    payType: null,
  })
})

test('normalizes the documented paid response and nested payment details', () => {
  assert.deepEqual(normalizePaymentStatus({
    isPaid: true,
    payment: { paymentNo: 'PAY20260819001', payType: 2, status: 1 },
  }), {
    state: 'paid',
    title: '支付成功',
    description: '订单已支付，商家将尽快为您发货。',
    isPaid: true,
    canPay: false,
    paymentNo: 'PAY20260819001',
    payType: 2,
  })
})

test('recognizes processing and failed payment records', () => {
  assert.equal(normalizePaymentStatus({ payment: { status: 0 } }).state, 'processing')
  assert.equal(normalizePaymentStatus({ payment: { status: 2, statusName: '支付失败' } }).state, 'failed')
  assert.equal(normalizePaymentStatus({ payment: { status: 'FAILED' } }).state, 'failed')
})

test('paid status cannot regress to processing', () => {
  const paid = normalizePaymentStatus({ isPaid: true, payment: { status: 1 } })
  const processing = normalizePaymentStatus({ payment: { status: 0 } })
  assert.equal(mergePaymentStatus(paid, processing).state, 'paid')
})

test('a known payment number plus confirmation uncertainty remains processing', () => {
  const status = normalizePaymentStatus({ payment: { paymentNo: 'P1', status: 0 } })
  assert.equal(status.canPay, false)
})

test('extracts a payment number from supported create-payment responses', () => {
  assert.equal(extractPaymentNo('PAY001'), 'PAY001')
  assert.equal(extractPaymentNo({ paymentNo: 'PAY002' }), 'PAY002')
  assert.equal(extractPaymentNo({ payment: { paymentNo: 'PAY003' } }), 'PAY003')
  assert.equal(extractPaymentNo({ data: { id: 'PAY004' } }), 'PAY004')
  assert.equal(extractPaymentNo(null), '')
})
