import { readPayloadList, toFiniteNumber, toNonNegativeMoney, unwrapData } from './response.js'

const toDate = (value) => value ? String(value).slice(0, 10) : ''

const STATUS_TEXT = {
  0: '未使用',
  1: '已使用',
  2: '已过期',
}

export function normalizeCouponList(payload, mode = 'available') {
  const source = unwrapData(payload)
  const list = readPayloadList(payload).map((item) => {
    const record = item?.userCoupon || item || {}
    const template = item?.couponTemplate || item?.template || item?.coupon || record?.couponTemplate || record
    const statusValue = record?.status ?? item?.status
    const status = mode === 'mine' && statusValue !== '' && statusValue != null ? toFiniteNumber(statusValue, 0) : null
    const templateId = record?.templateId ?? item?.templateId ?? template?.id ?? item?.id
    const id = mode === 'mine' ? (record?.id ?? item?.userCouponId ?? item?.id) : templateId
    const shopId = template?.shopId ?? item?.shopId

    return {
      id,
      templateId,
      name: template?.name || template?.couponName || item?.name || '优惠券',
      amount: toNonNegativeMoney(template?.amount ?? template?.discountAmount ?? item?.amount, 0),
      minAmount: toNonNegativeMoney(template?.minAmount ?? template?.threshold ?? item?.minAmount, 0),
      type: toFiniteNumber(template?.type ?? item?.type, 1) || 1,
      status,
      statusText: mode === 'mine' ? (record?.statusName || item?.statusName || STATUS_TEXT[status] || '状态未知') : '可领取',
      startTime: toDate(template?.startTime ?? record?.startTime ?? item?.startTime),
      endTime: toDate(template?.endTime ?? record?.endTime ?? item?.endTime),
      shopName: template?.shopName || item?.shopName || (shopId ? '店铺专享券' : '京东商城平台券'),
    }
  }).filter((item) => item.id != null && item.templateId != null)

  return {
    list,
    total: Math.max(0, toFiniteNumber(source?.total ?? source?.totalCount, list.length)),
  }
}

export function filterCouponsByStatus(coupons, status) {
  if (status === '' || status == null) return coupons || []
  return (coupons || []).filter((item) => Number(item.status) === Number(status))
}

export function filterUsableCoupons(coupons, goodsAmount) {
  const amount = toNonNegativeMoney(goodsAmount, 0)
  return (coupons || []).filter((item) => Number(item.status) === 0 && amount >= toNonNegativeMoney(item.minAmount, 0))
}

export function getCouponValueText(coupon) {
  const amount = toNonNegativeMoney(coupon?.amount, 0)
  if (Number(coupon?.type) === 2) {
    const discount = amount / 10
    return `${Number.isInteger(discount) ? discount : discount.toFixed(1)}折`
  }
  return `¥${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
}

export function getCouponDiscountAmount(coupon, goodsAmount) {
  const goods = toNonNegativeMoney(goodsAmount, 0)
  if (!coupon) return 0
  const amount = toNonNegativeMoney(coupon.amount ?? coupon.discountAmount, 0)
  const discount = Number(coupon.type) === 2
    ? goods * (1 - Math.min(100, Math.max(0, amount)) / 100)
    : amount
  return Math.round(Math.min(goods, Math.max(0, discount)) * 100) / 100
}
