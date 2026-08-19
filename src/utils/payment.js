import { toBoundedPositiveInteger, unwrapData } from './response.js'
import { normalizeOrderDetail } from './order.js'

export const PAYMENT_METHODS = [
  { value: 1, label: '微信支付', description: '推荐使用微信扫码支付', shortName: '微信' },
  { value: 2, label: '支付宝', description: '使用支付宝安全付款', shortName: '支付宝' },
  { value: 3, label: '余额支付', description: '使用账户可用余额付款', shortName: '余额' },
]

const PAID_STATUSES = new Set([1, '1', 'PAID', 'SUCCESS', 'SUCCESSFUL', '已支付', '支付成功'])
const FAILED_STATUSES = new Set([-1, 2, '-1', '2', 'FAIL', 'FAILED', 'CLOSED', 'CANCELLED', '支付失败', '已关闭'])

export function extractPaymentNo(payload) {
  const source = unwrapData(payload) ?? {}
  if (typeof source === 'string' || typeof source === 'number') return String(source)
  return String(source?.paymentNo || source?.payment?.paymentNo || source?.id || '')
}

export function normalizePaymentStatus(payload) {
  const source = unwrapData(payload) ?? {}
  const payment = source?.payment || null
  const rawStatus = payment?.status ?? source?.status
  const statusName = payment?.statusName || source?.statusName || ''
  const isPaid = source?.isPaid === true || PAID_STATUSES.has(rawStatus) || PAID_STATUSES.has(statusName)
  const isFailed = FAILED_STATUSES.has(rawStatus) || FAILED_STATUSES.has(String(rawStatus).toUpperCase()) || FAILED_STATUSES.has(statusName)
  const base = {
    isPaid,
    canPay: !isPaid,
    paymentNo: extractPaymentNo(payment),
    payType: payment?.payType == null ? null : toBoundedPositiveInteger(payment.payType, { fallback: null, max: 99 }),
  }

  if (isPaid) {
    return { state: 'paid', title: '支付成功', description: '订单已支付，商家将尽快为您发货。', ...base, canPay: false }
  }
  if (isFailed) {
    return { state: 'failed', title: '支付未完成', description: '本次支付没有成功，您可以重新选择支付方式。', ...base, isPaid: false, canPay: true }
  }
  if (payment) {
    return { state: 'processing', title: '支付处理中', description: '支付结果正在确认，请稍候。', ...base, isPaid: false, canPay: false }
  }
  return {
    state: 'unpaid',
    title: '等待付款',
    description: '订单尚未支付，请选择支付方式完成付款。',
    isPaid: false,
    canPay: true,
    paymentNo: '',
    payType: null,
  }
}

export function mergePaymentStatus(current, incoming) {
  if (current?.state === 'paid') return current
  if (incoming?.state === 'paid') return incoming
  if (current?.state === 'processing' && current.paymentNo && incoming?.state === 'unpaid') return current
  return incoming || current || normalizePaymentStatus(null)
}

export function createPaymentLifecycle() {
  let active = true
  let routeGeneration = 0
  let statusSequence = 0
  let lastAppliedStatusSequence = 0

  const normalizeOrderNo = (orderNo) => String(orderNo || '')

  function reset(orderNo) {
    active = true
    routeGeneration += 1
    statusSequence = 0
    lastAppliedStatusSequence = 0
    return { generation: routeGeneration, orderNo: normalizeOrderNo(orderNo) }
  }

  function isCurrent(snapshot, orderNo = snapshot?.orderNo) {
    return active && snapshot?.generation === routeGeneration && snapshot?.orderNo === normalizeOrderNo(orderNo)
  }

  function invalidate() {
    active = false
    routeGeneration += 1
    statusSequence = 0
    lastAppliedStatusSequence = 0
  }

  function nextStatusSequence() {
    return ++statusSequence
  }

  function canCommitStatus(snapshot, sequence, orderNo = snapshot?.orderNo) {
    if (!isCurrent(snapshot, orderNo) || sequence <= lastAppliedStatusSequence) return false
    lastAppliedStatusSequence = sequence
    return true
  }

  return { reset, isCurrent, invalidate, nextStatusSequence, canCommitStatus }
}

export function resolvePaymentAmount({ orderDetail } = {}) {
  if (!orderDetail) return null
  const detail = normalizeOrderDetail(orderDetail)
  return Number.isFinite(detail.payAmount) ? detail.payAmount : null
}

const noop = () => {}
const defaultNotify = { info: noop, success: noop, warning: noop, error: noop }

export async function submitSimulatedPayment({
  orderNo,
  payType,
  createPayment,
  confirmPayment,
  getPaymentStatus,
  fetchStatus,
  commitStatus,
  startPolling,
  isCurrent = () => true,
  notify = defaultNotify,
}) {
  const safeNotify = { ...defaultNotify, ...notify }
  const numericPayType = Number(payType)
  let paymentNo = ''
  let createMayHaveSucceeded = false

  const processingStatus = () => normalizePaymentStatus({ payment: { paymentNo, payType: numericPayType, status: 0 } })

  try {
    const created = await createPayment({ orderNo, payType: numericPayType })
    if (!isCurrent()) return { state: 'stale' }
    createMayHaveSucceeded = true
    paymentNo = extractPaymentNo(created)
    commitStatus(processingStatus())

    if (!paymentNo) {
      startPolling(orderNo)
      safeNotify.warning('支付请求已提交，结果暂时无法确认，页面将继续自动查询')
      return { state: 'processing', reason: 'missing-payment-number' }
    }

    await confirmPayment({ paymentNo })
    if (!isCurrent()) return { state: 'stale' }
    safeNotify.info('支付已提交，正在确认结果')
  } catch (error) {
    if (!isCurrent()) return { state: 'stale' }
    if (createMayHaveSucceeded || paymentNo) {
      commitStatus(processingStatus())
      startPolling(orderNo)
      safeNotify.warning(error?.message || '支付请求已提交，结果暂时无法确认，页面将继续自动查询')
      return { state: 'processing', reason: 'ambiguous-payment' }
    }

    const failed = normalizePaymentStatus({ payment: { payType: numericPayType, status: 2, statusName: '支付失败' } })
    commitStatus(failed)
    safeNotify.error(error?.message || '支付未完成，请稍后重试')
    return { state: 'failed', reason: 'create-failed' }
  }

  try {
    const result = fetchStatus ? await fetchStatus() : normalizePaymentStatus(await getPaymentStatus(orderNo))
    if (!isCurrent()) return { state: 'stale' }
    const status = fetchStatus ? result : commitStatus(result)
    if (status?.state === 'paid') safeNotify.success('支付成功')
    else if (status?.state === 'processing') startPolling(orderNo)
    return status || { state: 'processing' }
  } catch {
    if (!isCurrent()) return { state: 'stale' }
    const status = commitStatus(processingStatus())
    startPolling(orderNo)
    safeNotify.warning('支付已提交，结果查询暂时失败，页面将继续自动查询')
    return status
  }
}
