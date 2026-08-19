import { readPayloadList, toBoundedPositiveInteger, toNonNegativeMoney } from './response.js'

const toSafePositiveInteger = (value) => {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

export const normalizeCartItem = (item = {}) => {
  const sku = item.sku || item.productSku || item.skuInfo || {}
  const product = item.product || sku.product || {}
  const rawId = item.id ?? item.cartItemId
  const rawSkuId = item.skuId ?? sku.id ?? item.productId
  const rawPrice = item.price ?? item.skuPrice ?? sku.price
  const rawQuantity = item.quantity ?? item.buyQuantity
  const id = toSafePositiveInteger(rawId)
  const skuId = toSafePositiveInteger(rawSkuId)
  const price = toNonNegativeMoney(rawPrice, 0)
  const quantity = toBoundedPositiveInteger(rawQuantity, { fallback: 1, max: 99 })
  return {
    id,
    skuId,
    name: item.productName || product.name || item.name || sku.skuName || '商品',
    skuName: item.skuName || sku.skuName || '',
    image: item.image || sku.image || product.mainImage || '',
    price,
    quantity,
    checked: item.checked === true || item.selected === true || item.selected === 1,
    isValid: id != null && skuId != null && Number.isFinite(Number(rawPrice)) && Number(rawPrice) >= 0 && Number.isInteger(Number(rawQuantity)) && Number(rawQuantity) > 0,
  }
}

export const normalizeCartList = (payload) => {
  return readPayloadList(payload).map(normalizeCartItem)
}

export const mergeCartItem = (list, item) => {
  const next = list.map((entry) => ({ ...entry }))
  const index = next.findIndex((entry) => entry.skuId === item.skuId)
  const quantity = toBoundedPositiveInteger(item?.quantity, { fallback: 1, max: 99 })
  if (index === -1) return [...next, { ...item, quantity, checked: true }]
  next[index].quantity = Math.min(99, toBoundedPositiveInteger(next[index].quantity, { fallback: 1, max: 99 }) + quantity)
  next[index].checked = true
  return next
}

export const calculateCartTotals = (list) => list.reduce((totals, item) => ({
  totalCount: totals.totalCount + toBoundedPositiveInteger(item?.quantity, { fallback: 1, max: 99 }),
  totalPrice: item?.checked ? totals.totalPrice + toNonNegativeMoney(item?.price, 0) * toBoundedPositiveInteger(item?.quantity, { fallback: 1, max: 99 }) : totals.totalPrice,
}), { totalCount: 0, totalPrice: 0 })
