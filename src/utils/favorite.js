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

  const source = payload?.data ?? payload
  if (source !== payload) return normalizeFavoriteState(source)

  const key = favoriteKeys.find((name) => Object.prototype.hasOwnProperty.call(source, name))
  return key ? toBoolean(source[key]) : false
}

const getList = (payload) => {
  const source = payload?.data ?? payload
  if (Array.isArray(source)) return source
  return source?.list || source?.records || source?.items || []
}

const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function normalizeFavoriteList(payload) {
  const source = payload?.data ?? payload
  const list = getList(payload)
    .map((item) => {
      const product = item?.product || item?.productInfo || item || {}
      const productId = item?.productId ?? product?.id
      const hasWrappedProduct = Boolean(item?.product || item?.productInfo)

      return {
        favoriteId: item?.favoriteId ?? (hasWrappedProduct ? item?.id ?? null : null),
        productId,
        title: product?.name || product?.title || product?.productName || '未命名商品',
        image: product?.mainImage || product?.image || product?.cover || product?.picUrl || '',
        price: toNumber(
          item?.minPrice ??
            product?.minPrice ??
            product?.price ??
            product?.skuList?.[0]?.price ??
            item?.price,
        ),
        sales: toNumber(product?.sales ?? product?.saleCount ?? product?.salesCount ?? item?.sales),
        favoriteTime: item?.favoriteTime || item?.createTime || item?.createdAt || '',
      }
    })
    .filter((item) => item.productId != null)

  return {
    list,
    total: toNumber(source?.total ?? source?.totalCount ?? list.length),
  }
}
