import { getCouponDiscountAmount } from './coupon.js'
export { normalizeOrderList } from './order.js'

const asList = (payload) => Array.isArray(payload) ? payload : (payload?.list || payload?.records || [])

export function normalizeAddressList(payload) {
  return asList(payload).map((item) => ({
    ...item,
    isDefault: item.isDefault === 1 || item.isDefault === true,
    fullAddress: [item.province, item.city, item.district, item.detailAddress].filter(Boolean).join(''),
  })).sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

export function normalizeProductList(payload) {
  const list = asList(payload).map((item) => {
    const product = item?.product || item || {}
    return {
      id: product.id,
      title: product.name || product.title || '未命名商品',
      image: product.mainImage || product.images?.[0] || '',
      price: Number(item?.minPrice ?? product.minPrice ?? product.price ?? 0),
      sales: Number(product.salesCount || product.sales || 0),
    }
  }).filter((item) => item.id)
  return { list, total: Number(payload?.total ?? list.length) }
}

export function calculateCheckoutTotals(items, coupon) {
  const normalized = items || []
  const goodsAmount = normalized.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  const discountAmount = getCouponDiscountAmount(coupon, goodsAmount)
  return {
    goodsAmount,
    discountAmount,
    payableAmount: Math.max(0, goodsAmount - discountAmount),
    totalCount: normalized.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
  }
}

export const formatMoney = (amount) => Number(amount || 0).toFixed(2)
