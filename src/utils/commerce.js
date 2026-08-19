import { getCouponDiscountAmount } from './coupon.js'
import { readPayloadList, toBoundedPositiveInteger, toFiniteNumber, toNonNegativeMoney, unwrapData } from './response.js'
export { normalizeOrderList } from './order.js'

export function normalizeAddressList(payload) {
  return readPayloadList(payload).map((item) => ({
    ...item,
    isDefault: item.isDefault === 1 || item.isDefault === true,
    fullAddress: [item.province, item.city, item.district, item.detailAddress].filter(Boolean).join(''),
  })).sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

export function normalizeProductList(payload) {
  const source = unwrapData(payload)
  const list = readPayloadList(payload).map((item) => {
    const product = item?.product || item || {}
    return {
      id: product.id,
      title: product.name || product.title || '未命名商品',
      image: product.mainImage || product.images?.[0] || '',
      price: toNonNegativeMoney(item?.minPrice ?? product.minPrice ?? product.price, 0),
      sales: Math.max(0, toFiniteNumber(product.salesCount ?? product.sales, 0)),
    }
  }).filter((item) => item.id)
  return { list, total: Math.max(0, toFiniteNumber(source?.total, list.length)) }
}

export function calculateCheckoutTotals(items, coupon) {
  const normalized = items || []
  const goodsAmount = normalized.reduce((sum, item) => sum + toNonNegativeMoney(item?.price, 0) * toBoundedPositiveInteger(item?.quantity, { fallback: 1, max: 99 }), 0)
  const discountAmount = getCouponDiscountAmount(coupon, goodsAmount)
  return {
    goodsAmount,
    discountAmount,
    payableAmount: Math.max(0, goodsAmount - discountAmount),
    totalCount: normalized.reduce((sum, item) => sum + toBoundedPositiveInteger(item?.quantity, { fallback: 1, max: 99 }), 0),
  }
}

export const formatMoney = (amount) => toNonNegativeMoney(amount, 0).toFixed(2)
