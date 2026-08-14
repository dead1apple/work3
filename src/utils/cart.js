export const normalizeCartItem = (item = {}) => {
  const sku = item.sku || item.productSku || item.skuInfo || {}
  const product = item.product || sku.product || {}
  return {
    id: item.id,
    skuId: item.skuId ?? sku.id ?? item.productId,
    name: item.productName || product.name || item.name || sku.skuName || '商品',
    skuName: item.skuName || sku.skuName || '',
    image: item.image || sku.image || product.mainImage || '',
    price: Number(item.price ?? item.skuPrice ?? sku.price ?? 0),
    quantity: Math.min(99, Math.max(1, Number(item.quantity ?? item.buyQuantity ?? 1))),
    checked: item.checked === true || item.selected === true || item.selected === 1,
  }
}

export const normalizeCartList = (payload) => {
  const list = Array.isArray(payload) ? payload : payload?.list || payload?.records || []
  return list.map(normalizeCartItem)
}

export const mergeCartItem = (list, item) => {
  const next = list.map((entry) => ({ ...entry }))
  const index = next.findIndex((entry) => entry.skuId === item.skuId)
  if (index === -1) return [...next, { ...item, quantity: Math.min(99, Math.max(1, item.quantity || 1)), checked: true }]
  next[index].quantity = Math.min(99, next[index].quantity + (item.quantity || 1))
  next[index].checked = true
  return next
}

export const calculateCartTotals = (list) => list.reduce((totals, item) => ({
  totalCount: totals.totalCount + Number(item.quantity || 0),
  totalPrice: item.checked ? totals.totalPrice + Number(item.price || 0) * Number(item.quantity || 0) : totals.totalPrice,
}), { totalCount: 0, totalPrice: 0 })
