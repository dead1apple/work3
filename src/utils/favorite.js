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

const getProductDetail = (productDetails, productId) => {
  if (productDetails instanceof Map) return productDetails.get(Number(productId)) ?? productDetails.get(String(productId))
  return productDetails?.[productId]
}

const getLowestSkuPrice = (source = {}) => {
  const prices = (source.skuList || [])
    .map((sku) => Number(sku?.price))
    .filter((price) => Number.isFinite(price) && price >= 0)
  return prices.length ? Math.min(...prices) : undefined
}

export function normalizeFavoriteList(payload, productDetails = new Map()) {
  const source = unwrapData(payload)
  const list = readPayloadList(payload)
    .map((item) => {
      const wrappedProduct = item?.product || item?.productInfo
      const initialProductId = item?.productId ?? wrappedProduct?.id ?? item?.id
      const detailSource = unwrapData(getProductDetail(productDetails, initialProductId)) || {}
      const detailProduct = detailSource?.product || detailSource
      const isFavoriteRecord = item?.productId != null || item?.userId != null
      const product = wrappedProduct || (detailProduct?.id ? detailProduct : null) || (isFavoriteRecord ? {} : item) || {}
      const productId = item?.productId ?? product?.id
      const hasWrappedProduct = Boolean(item?.product || item?.productInfo)
      const skuPrice = getLowestSkuPrice(detailSource)

      return {
        favoriteId: item?.favoriteId ?? (hasWrappedProduct || isFavoriteRecord ? item?.id ?? null : null),
        productId,
        title: product?.name || product?.title || product?.productName || '商品信息暂不可用',
        image: product?.mainImage || product?.image || product?.cover || product?.picUrl || '',
        price: toNonNegativeMoney(
          item?.minPrice ??
            detailSource?.minPrice ??
            product?.minPrice ??
            product?.price ??
            product?.skuList?.[0]?.price ??
            skuPrice ??
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
