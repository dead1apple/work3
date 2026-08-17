const toPositiveInteger = (value) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

const toMoney = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function parseBuyNowQuery(query = {}) {
  const productId = toPositiveInteger(query.productId)
  const skuId = toPositiveInteger(query.skuId)
  if (!productId || !skuId) throw new Error('商品参数无效，请返回商品详情重新选择')
  const requestedQuantity = toPositiveInteger(query.quantity) || 1
  return { productId, skuId, quantity: Math.min(99, requestedQuantity) }
}

export function normalizeBuyNowItem(payload, selection) {
  const source = payload?.data ?? payload ?? {}
  const product = source?.product || source
  const skuList = source?.skuList || product?.skuList || []
  const sku = skuList.find((item) => Number(item.id) === Number(selection?.skuId))
  if (!sku) throw new Error('所选商品规格不存在，请返回商品详情重新选择')

  let specText = ''
  try {
    specText = Object.values(JSON.parse(sku.specValues || '{}')).map(String).join(' / ')
  } catch {
    specText = ''
  }

  const stock = Math.max(0, Number(sku.stock || 0))
  const requestedQuantity = Math.min(99, Math.max(1, Number(selection?.quantity || 1)))
  return {
    productId: product.id,
    skuId: sku.id,
    name: product.name || product.title || '未命名商品',
    image: sku.image || product.mainImage || product.images?.[0] || '',
    skuName: sku.skuName || '',
    specText: specText || sku.skuName || '',
    price: toMoney(sku.price),
    marketPrice: toMoney(sku.marketPrice),
    stock,
    quantity: stock > 0 ? Math.min(requestedQuantity, stock) : 1,
  }
}

export function buildBuyNowPayload({ item, addressId, remark }) {
  const normalizedAddressId = toPositiveInteger(addressId)
  if (!normalizedAddressId) throw new Error('请选择收货地址')
  if (!toPositiveInteger(item?.skuId)) throw new Error('商品规格无效')
  return {
    skuId: Number(item.skuId),
    quantity: Math.min(99, Math.max(1, Number(item.quantity || 1))),
    addressId: normalizedAddressId,
    remark: String(remark || '').trim(),
  }
}

export function extractOrderNo(payload) {
  const source = payload?.data ?? payload
  if (typeof source === 'string' || typeof source === 'number') return String(source)
  return source?.orderNo || source?.order?.orderNo || source?.order?.id || ''
}
