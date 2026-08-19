import { readPayloadList, toFiniteNumber, toNonNegativeMoney, unwrapData } from './response.js'

const favoriteKeys = ['favorite', 'isFavorite', 'collected', 'exist']

const toBoolean = (value) => {
  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.toLowerCase())
  }
  return Boolean(value)
}

export function normalizeFavoriteState(payload) {
  if (payload == null) return false
  if (typeof payload === 'boolean' || typeof payload === 'number' || typeof payload === 'string') {
    return toBoolean(payload)
  }

  const source = unwrapData(payload)
  if (source !== payload) return normalizeFavoriteState(source)

  const key = favoriteKeys.find((name) => Object.prototype.hasOwnProperty.call(source, name))
  return key ? toBoolean(source[key]) : false
}

export function normalizeFavoriteList(payload) {
  const source = unwrapData(payload)
  const list = readPayloadList(payload)
    .map((item) => {
      const product = item?.product || item?.productInfo || item || {}
      const productId = item?.productId ?? product?.id
      const hasWrappedProduct = Boolean(item?.product || item?.productInfo)

      return {
        favoriteId: item?.favoriteId ?? (hasWrappedProduct ? item?.id ?? null : null),
        productId,
        title: product?.name || product?.title || product?.productName || '未命名商品',
        image: product?.mainImage || product?.image || product?.cover || product?.picUrl || '',
        price: toNonNegativeMoney(
          item?.minPrice ??
            product?.minPrice ??
            product?.price ??
            product?.skuList?.[0]?.price ??
            item?.price,
        ),
        sales: Math.max(0, toFiniteNumber(product?.sales ?? product?.saleCount ?? product?.salesCount ?? item?.sales, 0)),
        favoriteTime: item?.favoriteTime || item?.createTime || item?.createdAt || '',
      }
    })
    .filter((item) => item.productId != null)

  return {
    list,
    total: Math.max(0, toFiniteNumber(source?.total ?? source?.totalCount, list.length)),
  }
}
