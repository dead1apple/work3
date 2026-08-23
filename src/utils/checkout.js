import { toBoundedPositiveInteger, toNonNegativeMoney, unwrapData } from './response.js'

const toPositiveInteger = (value) => toBoundedPositiveInteger(value, { fallback: null, max: Number.MAX_SAFE_INTEGER })

export function parseBuyNowQuery(query = {}) {
  const productId = toPositiveInteger(query.productId)
  const skuId = toPositiveInteger(query.skuId)
  if (!productId || !skuId) throw new Error('商品参数无效，请返回商品详情重新选择')
  const requestedQuantity = toBoundedPositiveInteger(query.quantity, { fallback: 1, max: 99 })
  return { productId, skuId, quantity: requestedQuantity }
}

export function normalizeBuyNowItem(payload, selection) {
  const source = unwrapData(payload) ?? {}
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

  const stock = toBoundedPositiveInteger(sku.stock, { fallback: 0, max: Number.MAX_SAFE_INTEGER })
  const requestedQuantity = toBoundedPositiveInteger(selection?.quantity, { fallback: 1, max: 99 })
  return {
    productId: product.id,
    skuId: sku.id,
    name: product.name || product.title || '未命名商品',
    image: sku.image || product.mainImage || product.images?.[0] || '',
    skuName: sku.skuName || '',
    specText: specText || sku.skuName || '',
    price: toNonNegativeMoney(sku.price, 0),
    marketPrice: toNonNegativeMoney(sku.marketPrice, 0),
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
    quantity: toBoundedPositiveInteger(item?.quantity, { fallback: 1, max: 99 }),
    addressId: normalizedAddressId,
    remark: String(remark || '').trim(),
  }
}

export function buildCartOrderPayload({ items = [], addressId, couponId, remark }) {
  const normalizedAddressId = toPositiveInteger(addressId)
  if (!normalizedAddressId) throw new Error('请选择收货地址')
  const cartIds = items.map((item) => toPositiveInteger(item?.id))
  if (!cartIds.length || cartIds.some((id) => !id)) throw new Error('购物车数据异常，请刷新后重试')
  const normalizedCouponId = toPositiveInteger(couponId)
  return {
    cartIds,
    addressId: normalizedAddressId,
    ...(normalizedCouponId ? { couponId: normalizedCouponId } : {}),
    remark: String(remark || '').trim(),
  }
}

export function extractOrderNo(payload) {
  const source = unwrapData(payload)
  if (typeof source === 'string' || typeof source === 'number') return String(source)
  return source?.orderNo || source?.order?.orderNo || source?.order?.id || ''
}

export function createCheckoutSubmissionOutcome(payload) {
  return {
    orderNo: extractOrderNo(payload),
    terminal: true,
  }
}

export async function completeCheckoutSuccess({
  result,
  payableAmount,
  onTerminal,
  replace,
  notify,
}) {
  const outcome = createCheckoutSubmissionOutcome(result)
  onTerminal?.(outcome)
  try {
    if (!outcome.orderNo) {
      notify.warning('订单已创建，但未返回订单号，请在我的订单中查看')
      await replace('/orders')
      return { ...outcome, navigationFailed: false }
    }
    notify.success('订单提交成功，即将前往收银台')
    await replace({ path: `/payment/${outcome.orderNo}`, query: { amount: Number(payableAmount || 0).toFixed(2) } })
    return { ...outcome, navigationFailed: false }
  } catch {
    notify.warning('订单已创建，但页面跳转失败，请前往我的订单查看')
    return { ...outcome, navigationFailed: true }
  }
}
