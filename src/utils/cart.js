import { readPayloadList, toBoundedPositiveInteger, toNonNegativeMoney } from './response.js'

const SERVER_CART_ITEM_REQUIRED = '购物车已更新，但服务端未返回可操作的购物车记录，请刷新后重试'

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

export const getCanonicalCartItem = (result, skuId) => {
  const requestedSkuId = toSafePositiveInteger(skuId)
  if (requestedSkuId == null) return null

  const source = result?.data ?? result ?? {}
  const candidates = [source?.cartItem, source?.item, source]
  for (const candidate of candidates) {
    if (!candidate || Array.isArray(candidate) || typeof candidate !== 'object') continue
    const normalized = normalizeCartItem(candidate)
    if (normalized.id != null && normalized.skuId === requestedSkuId) return normalized
  }
  return null
}

export const addToCanonicalCart = async ({
  product,
  cartList,
  addCart,
  fetchCartList,
  updateQuantity,
  selectCartItem,
  commitCreatedCartItem,
}) => {
  const skuId = product?.skuId ?? product?.id
  if (!skuId) throw new Error('缺少商品 SKU')
  const quantity = Math.min(99, Math.max(1, Number(product.quantity || 1)))
  const existing = cartList.find((item) => item.skuId === skuId)

  if (existing) {
    const nextQuantity = Math.min(99, existing.quantity + quantity)
    const updated = await updateQuantity(existing.id, nextQuantity)
    if (!existing.checked) {
      await selectCartItem(existing.id)
      existing.checked = true
    }
    return updated || existing
  }

  const result = await addCart({ skuId, quantity })
  let created = getCanonicalCartItem(result, skuId)
  let fetchedCanonicalCart = false
  if (!created) {
    const serverCartList = await fetchCartList()
    created = serverCartList.find((item) => item.skuId === skuId) || null
    fetchedCanonicalCart = true
  }
  if (!created) throw new Error(SERVER_CART_ITEM_REQUIRED)

  created = normalizeCartList([{
    ...created,
    quantity: created.quantity || quantity,
    selected: created.checked ? 1 : 0,
    productName: created.name || product.name,
    image: created.image || product.image,
    price: created.price ?? product.price,
    skuName: created.skuName || product.skuName,
  }])[0]

  if (!fetchedCanonicalCart) commitCreatedCartItem(created, skuId)
  return created
}

export const createToggleItemHandler = ({ toggleCheck, onError }) => {
  return async (item, checked) => {
    try {
      await toggleCheck(item.id, checked)
    } catch (error) {
      onError(error)
    }
  }
}

export const createQuantityChangeHandler = ({
  isQuantityUpdating,
  setQuantityUpdating,
  updateQuantity,
  refetchCart,
  onSuccess,
  onError,
}) => {
  return async (item, currentValue, previousValue) => {
    if (isQuantityUpdating(item.id)) return
    setQuantityUpdating(item.id, true)
    try {
      await updateQuantity(item.id, currentValue)
      onSuccess()
    } catch (error) {
      item.quantity = previousValue
      onError(error)
      await refetchCart()
    } finally {
      setQuantityUpdating(item.id, false)
    }
  }
}

export const createCartLoadState = () => ({ initialLoading: false, loadError: '' })

export const loadCartWithRetryState = async ({ state, fetchCartList }) => {
  state.initialLoading = true
  state.loadError = ''
  try {
    await fetchCartList()
  } catch (error) {
    state.loadError = error.message || '购物车加载失败，请检查网络后重试'
  } finally {
    state.initialLoading = false
  }
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
