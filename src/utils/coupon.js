import { readPayloadList, toFiniteNumber, toNonNegativeMoney, unwrapData } from './response.js'

const toDate = (value) => value ? String(value).slice(0, 10) : ''

const STATUS_TEXT = {
  0: '未使用',
  1: '已使用',
  2: '已过期',
}

const toShopId = (value) => {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

const getSingleCheckoutShopId = (checkoutItems = []) => {
  const items = Array.isArray(checkoutItems) ? checkoutItems : []
  const shopIds = items.map((item) => toShopId(item?.shopId))
  return shopIds.length && shopIds.every((shopId) => shopId != null) && new Set(shopIds).size === 1
    ? shopIds[0]
    : null
}

const isApplicableToCheckout = (coupon, amount, checkoutShopId) => {
  if (amount < toNonNegativeMoney(coupon?.minAmount, 0)) return false
  const couponShopId = toShopId(coupon?.shopId)
  return couponShopId == null || couponShopId === checkoutShopId
}

const getTemplateKey = (coupon) => {
  const value = coupon?.templateId ?? coupon?.id
  return value == null || value === '' ? null : String(value)
}

export function normalizeCouponRouteState(query = {}) {
  return {
    tab: query.tab === 'mine' ? 'mine' : 'available',
    status: ['0', '1', '2'].includes(String(query.status)) ? String(query.status) : '',
  }
}

export function buildCouponRouteQuery(routeQuery = {}, activeTab = 'available', status = '') {
  const query = { ...routeQuery, tab: activeTab === 'mine' ? 'mine' : 'available' }
  if (query.tab === 'mine' && status !== '') query.status = String(status)
  else delete query.status
  return query
}

const stringifyQuery = (query = {}) => JSON.stringify(
  Object.fromEntries(Object.entries(query).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => [key, String(value)])),
)

export function shouldReplaceCouponRoute(currentQuery, nextQuery) {
  return stringifyQuery(currentQuery) !== stringifyQuery(nextQuery)
}

export function runActiveCouponRouteLoad({ routeState, loadAvailable, loadMine }) {
  return routeState.tab === 'available' ? loadAvailable() : loadMine(routeState.status)
}

export function normalizeCouponList(payload, mode = 'available', templates = []) {
  const source = unwrapData(payload)
  const templateMap = new Map((templates || []).map((template) => [Number(template.templateId ?? template.id), template]))
  const list = readPayloadList(payload).map((item) => {
    const record = item?.userCoupon || item || {}
    const embeddedTemplate = item?.couponTemplate || item?.template || item?.coupon || record?.couponTemplate
    const statusValue = record?.status ?? item?.status
    const status = mode === 'mine' && statusValue !== '' && statusValue != null ? toFiniteNumber(statusValue, 0) : null
    const templateId = record?.couponTemplateId ?? record?.templateId ?? item?.couponTemplateId ?? item?.templateId ?? embeddedTemplate?.id ?? item?.id
    const joinedTemplate = templateMap.get(Number(templateId))
    const template = embeddedTemplate || joinedTemplate || record
    const hasTemplateData = mode !== 'mine' || Boolean(
      embeddedTemplate ||
      joinedTemplate ||
      record?.amount != null ||
      record?.discountAmount != null,
    )
    const id = mode === 'mine' ? (record?.id ?? item?.userCouponId ?? item?.id) : templateId
    const shopId = toShopId(template?.shopId ?? item?.shopId)

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
      ...(shopId != null ? { shopId } : {}),
      shopName: template?.shopName || item?.shopName || (shopId ? '店铺专享券' : '京东商城平台券'),
      ...(mode === 'mine' ? { hasTemplateData } : {}),
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

export function filterUsableCoupons(coupons, goodsAmount, checkoutItems = []) {
  const amount = toNonNegativeMoney(goodsAmount, 0)
  const checkoutShopId = getSingleCheckoutShopId(checkoutItems)

  return (coupons || []).filter((item) => {
    return item.hasTemplateData !== false && Number(item.status) === 0 && isApplicableToCheckout(item, amount, checkoutShopId)
  })
}

export function filterClaimableCouponTemplates(templates, claimedCoupons, goodsAmount, checkoutItems = []) {
  const amount = toNonNegativeMoney(goodsAmount, 0)
  const checkoutShopId = getSingleCheckoutShopId(checkoutItems)
  const claimedTemplateKeys = new Set((claimedCoupons || []).map(getTemplateKey).filter(Boolean))
  return (templates || []).filter((template) => {
    const templateKey = getTemplateKey(template)
    return templateKey != null && !claimedTemplateKeys.has(templateKey) && isApplicableToCheckout(template, amount, checkoutShopId)
  })
}

export function getCouponValueText(coupon) {
  if (coupon?.hasTemplateData === false) return '优惠信息待同步'
  const amount = toNonNegativeMoney(coupon?.amount, 0)
  if (Number(coupon?.type) === 2) {
    const discount = amount / 10
    return `${Number.isInteger(discount) ? discount : discount.toFixed(1)}折`
  }
  return `¥${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
}

export function getCouponDiscountAmount(coupon, goodsAmount) {
  const goods = toNonNegativeMoney(goodsAmount, 0)
  if (!coupon || coupon.hasTemplateData === false) return 0
  const rawAmount = coupon.amount ?? coupon.discountAmount
  const rawPercentageRate = Number(rawAmount)
  if (Number(coupon.type) === 2 && (!Number.isFinite(rawPercentageRate) || rawPercentageRate < 0)) return 0
  const amount = toNonNegativeMoney(rawAmount, 0)
  const discount = Number(coupon.type) === 2
    ? goods * (1 - Math.min(100, rawPercentageRate) / 100)
    : amount
  return Math.round(Math.min(goods, Math.max(0, discount)) * 100) / 100
}
