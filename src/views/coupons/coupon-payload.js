const REQUIRED_FIELDS = ['name', 'type', 'amount', 'minAmount', 'totalCount', 'startTime', 'endTime', 'status']
const OPTIONAL_FIELDS = ['receiveStartTime', 'receiveEndTime', 'useStartTime', 'useEndTime', 'perUserLimit', 'maxDiscountAmount']

function numberOrUndefined(value) {
  return value === '' || value === null || value === undefined ? undefined : Number(value)
}

export function createCouponForm(coupon = {}) {
  return {
    name: coupon.name || '',
    type: coupon.type ?? 1,
    amount: coupon.amount ?? undefined,
    minAmount: coupon.minAmount ?? 0,
    totalCount: coupon.totalCount ?? undefined,
    startTime: coupon.startTime || '',
    endTime: coupon.endTime || '',
    receiveStartTime: coupon.receiveStartTime || '',
    receiveEndTime: coupon.receiveEndTime || '',
    useStartTime: coupon.useStartTime || '',
    useEndTime: coupon.useEndTime || '',
    perUserLimit: coupon.perUserLimit ?? undefined,
    maxDiscountAmount: coupon.maxDiscountAmount ?? undefined,
    status: coupon.status ?? 1,
  }
}

export function toMerchantCouponPayload(form) {
  const payload = {
    name: form.name.trim(),
    type: Number(form.type),
    amount: Number(form.amount),
    minAmount: Number(form.minAmount),
    totalCount: Number(form.totalCount),
    startTime: form.startTime,
    endTime: form.endTime,
    status: Number(form.status),
  }

  for (const field of OPTIONAL_FIELDS) {
    const value = field === 'perUserLimit' || field === 'maxDiscountAmount'
      ? numberOrUndefined(form[field])
      : form[field] || undefined
    if (value !== undefined) payload[field] = value
  }

  return payload
}

export function validateCouponPayload(payload) {
  if (REQUIRED_FIELDS.some((field) => payload[field] === '' || payload[field] === undefined || payload[field] === null)) {
    return '请完整填写优惠券必填信息'
  }
  if (payload.name.length > 100) return '优惠券名称不能超过 100 个字符'
  if (![1, 2, 3].includes(payload.type)) return '请选择接口支持的优惠券类型'
  if (!Number.isFinite(payload.amount) || payload.amount < 0.01) return '优惠值必须不小于 0.01'
  if (!Number.isFinite(payload.minAmount) || payload.minAmount < 0) return '使用门槛不能小于 0'
  if (!Number.isInteger(payload.totalCount) || payload.totalCount < 1) return '发放数量必须是大于 0 的整数'
  if (![0, 1].includes(payload.status)) return '请选择优惠券状态'
  if (new Date(payload.startTime) >= new Date(payload.endTime)) return '结束时间必须晚于开始时间'
  if (payload.perUserLimit !== undefined && (!Number.isInteger(payload.perUserLimit) || payload.perUserLimit < 1)) return '每人限领数量必须是大于 0 的整数'
  if (payload.maxDiscountAmount !== undefined && (!Number.isFinite(payload.maxDiscountAmount) || payload.maxDiscountAmount < 0.01)) return '最高优惠值必须不小于 0.01'
  return ''
}
