const asList = (payload) => {
  const source = payload?.data ?? payload
  if (Array.isArray(source)) return source
  return source?.list || source?.records || source?.items || []
}

const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const toDate = (value) => value ? String(value).slice(0, 10) : ''

const STATUS_TEXT = {
  0: '未使用',
  1: '已使用',
  2: '已过期',
}

export function normalizeCouponList(payload, mode = 'available') {
  const source = payload?.data ?? payload
  const list = asList(payload).map((item) => {
    const record = item?.userCoupon || item || {}
    const template = item?.couponTemplate || item?.template || item?.coupon || record?.couponTemplate || record
    const statusValue = record?.status ?? item?.status
    const status = mode === 'mine' && statusValue !== '' && statusValue != null ? toNumber(statusValue) : null
    const templateId = record?.templateId ?? item?.templateId ?? template?.id ?? item?.id
    const id = mode === 'mine' ? (record?.id ?? item?.userCouponId ?? item?.id) : templateId
    const shopId = template?.shopId ?? item?.shopId

    return {
      id,
      templateId,
      name: template?.name || template?.couponName || item?.name || '优惠券',
      amount: toNumber(template?.amount ?? template?.discountAmount ?? item?.amount),
      minAmount: toNumber(template?.minAmount ?? template?.threshold ?? item?.minAmount),
      type: toNumber(template?.type ?? item?.type) || 1,
      status,
      statusText: mode === 'mine' ? (record?.statusName || item?.statusName || STATUS_TEXT[status] || '状态未知') : '可领取',
      startTime: toDate(template?.startTime ?? record?.startTime ?? item?.startTime),
      endTime: toDate(template?.endTime ?? record?.endTime ?? item?.endTime),
      shopName: template?.shopName || item?.shopName || (shopId ? '店铺专享券' : '京东商城平台券'),
    }
  }).filter((item) => item.id != null && item.templateId != null)

  return {
    list,
    total: toNumber(source?.total ?? source?.totalCount ?? list.length),
  }
}

export function filterCouponsByStatus(coupons, status) {
  if (status === '' || status == null) return coupons || []
  return (coupons || []).filter((item) => Number(item.status) === Number(status))
}

export function filterUsableCoupons(coupons, goodsAmount) {
  const amount = toNumber(goodsAmount)
  return (coupons || []).filter((item) => Number(item.status) === 0 && amount >= toNumber(item.minAmount))
}

export function getCouponValueText(coupon) {
  const amount = toNumber(coupon?.amount)
  if (Number(coupon?.type) === 2) {
    const discount = amount / 10
    return `${Number.isInteger(discount) ? discount : discount.toFixed(1)}折`
  }
  return `¥${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
}

export function getCouponDiscountAmount(coupon, goodsAmount) {
  const goods = toNumber(goodsAmount)
  if (!coupon) return 0
  const amount = toNumber(coupon.amount ?? coupon.discountAmount)
  const discount = Number(coupon.type) === 2
    ? goods * (1 - Math.min(100, Math.max(0, amount)) / 100)
    : amount
  return Math.round(Math.min(goods, Math.max(0, discount)) * 100) / 100
}
