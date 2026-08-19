import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PAYMENT_METHODS,
  extractPaymentNo,
  createPaymentLifecycle,
  mergePaymentStatus,
  normalizePaymentStatus,
  resolvePaymentAmount,
  submitSimulatedPayment,
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

test('successful create without a payment number remains processing and starts reconciliation', async () => {
  const committed = []
  const polling = []
  const messages = []

  await submitSimulatedPayment({
    orderNo: 'O1',
    payType: 2,
    createPayment: async () => ({ data: {} }),
    confirmPayment: async () => { throw new Error('confirm should not run without payment number') },
    getPaymentStatus: async () => { throw new Error('status should poll later') },
    commitStatus: (status) => committed.push(status),
    startPolling: (order) => polling.push(order),
    notify: { warning: (message) => messages.push(message), error: (message) => messages.push(message), info: () => {}, success: () => {} },
  })

  assert.deepEqual(committed.map((status) => status.state), ['processing'])
  assert.equal(committed[0].canPay, false)
  assert.deepEqual(polling, ['O1'])
  assert.equal(messages.length, 1)
})

test('confirm failure after a payment number remains processing and starts reconciliation', async () => {
  const committed = []
  const polling = []

  await submitSimulatedPayment({
    orderNo: 'O2',
    payType: 1,
    createPayment: async () => ({ paymentNo: 'P2' }),
    confirmPayment: async () => { throw new Error('timeout') },
    getPaymentStatus: async () => { throw new Error('status should poll later') },
    commitStatus: (status) => committed.push(status),
    startPolling: (order) => polling.push(order),
    notify: { warning: () => {}, error: () => {}, info: () => {}, success: () => {} },
  })

  assert.deepEqual(committed.map((status) => status.state), ['processing', 'processing'])
  assert.ok(committed.every((status) => status.canPay === false))
  assert.deepEqual(polling, ['O2'])
})

test('payment lifecycle suppresses stale ordering and invalidates on unmount', () => {
  const lifecycle = createPaymentLifecycle()
  const firstRoute = lifecycle.reset('O1')
  const firstStatus = lifecycle.nextStatusSequence()
  const secondStatus = lifecycle.nextStatusSequence()

  assert.equal(lifecycle.canCommitStatus(firstRoute, secondStatus, 'O1'), true)
  assert.equal(lifecycle.canCommitStatus(firstRoute, firstStatus, 'O1'), false)

  const secondRoute = lifecycle.reset('O2')
  assert.equal(lifecycle.isCurrent(firstRoute, 'O1'), false)
  assert.equal(lifecycle.isCurrent(secondRoute, 'O2'), true)

  lifecycle.invalidate()
  assert.equal(lifecycle.isCurrent(secondRoute, 'O2'), false)
  assert.equal(lifecycle.canCommitStatus(secondRoute, lifecycle.nextStatusSequence(), 'O2'), false)
})

test('payment amount comes from order detail independent of route query amount', () => {
  const amount = resolvePaymentAmount({
    orderDetail: { orderNo: 'O3', payAmount: '88.50' },
    routeQuery: { amount: '1.00' },
  })

  assert.equal(amount, 88.5)
  assert.equal(resolvePaymentAmount({ routeQuery: { amount: '123.45' } }), null)
})
