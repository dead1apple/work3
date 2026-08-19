const toPositiveInteger = (value) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

export function selectReviewItem(items = [], requestedId) {
  if (!items.length) return null
  if (requestedId == null || requestedId === '') return items[0]
  const normalizedId = toPositiveInteger(requestedId)
  return items.find((item) => Number(item.orderItemId ?? item.id) === normalizedId) || null
}

export function normalizeReviewImages(images = []) {
  const values = Array.isArray(images) ? images : String(images || '').split(',')
  const normalized = [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
  if (normalized.length > 5) throw new Error('最多添加 5 张评价图片')
  normalized.forEach((value) => {
    let url
    try { url = new URL(value) } catch { throw new Error('图片地址必须以 https:// 开头') }
    if (url.protocol !== 'https:') throw new Error('图片地址必须以 https:// 开头')
  })
  return normalized
}

export function buildReviewPayload(form = {}) {
  const orderItemId = toPositiveInteger(form.orderItemId)
  if (!orderItemId) throw new Error('订单商品无效，请返回订单详情重新选择')
  const rating = Number(form.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('评分必须为 1 到 5 星')
  const content = String(form.content || '').trim()
  if (content.length > 500) throw new Error('评价内容不能超过 500 个字')
  const imageUrls = normalizeReviewImages(form.images)
  return {
    orderItemId,
    rating,
    content,
    ...(imageUrls.length ? { images: imageUrls.join(',') } : {}),
    isAnonymous: form.isAnonymous === true || Number(form.isAnonymous) === 1 ? 1 : 0,
  }
}
