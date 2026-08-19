import { toBoundedPositiveInteger, unwrapData } from './response.js'

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
