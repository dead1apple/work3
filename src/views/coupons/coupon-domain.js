const COUPON_STATUSES = Object.freeze({
  0: Object.freeze({ label: '已停用', type: 'info' }),
  1: Object.freeze({ label: '已启用', type: 'success' }),
})

export const COUPON_STATUS_OPTIONS = Object.freeze([
  Object.freeze({ label: '全部状态', value: '' }),
  Object.freeze({ label: '已停用', value: 0 }),
  Object.freeze({ label: '已启用', value: 1 }),
])

// OpenAPI only defines the integer range 1–3, not their business labels.
export const COUPON_TYPE_OPTIONS = Object.freeze([1, 2, 3].map((value) => Object.freeze({
  label: `类型 ${value}`,
  value,
})))

export function getCouponStatus(status) {
  return COUPON_STATUSES[status] || { label: `未知状态（${status}）`, type: 'info' }
}

export function getCouponType(type) {
  return `类型 ${type}`
}

export function formatCouponAmount(amount) {
  return `¥${Number(amount || 0).toFixed(2)}`
}

export function displayTime(value) {
  return value || '—'
}

export function canEditCoupon(coupon) {
  return Number(coupon.issuedCount || 0) === 0
}
