const SORT_VALUES = new Set(['default', 'sales', 'price_asc', 'price_desc'])

const toPositiveInteger = (value, fallback = null) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function normalizeSearchQuery(value = {}) {
  const sortBy = SORT_VALUES.has(value.sortBy) ? value.sortBy : 'default'
  return {
    keyword: String(value.keyword || '').trim(),
    categoryId: toPositiveInteger(value.categoryId),
    brandId: toPositiveInteger(value.brandId),
    sortBy,
    page: toPositiveInteger(value.page, 1),
    size: 12,
  }
}

export function serializeSearchQuery(value) {
  const query = {}
  if (value.keyword) query.keyword = value.keyword.trim()
  if (value.categoryId) query.categoryId = String(value.categoryId)
  if (value.brandId) query.brandId = String(value.brandId)
  if (value.sortBy && value.sortBy !== 'default') query.sortBy = value.sortBy
  if (value.page > 1) query.page = String(value.page)
  return query
}

export function flattenCategoryOptions(nodes = [], parentName = '') {
  return nodes.flatMap((node) => {
    const name = parentName ? `${parentName} / ${node.name}` : node.name
    return [{ id: node.id, name }, ...flattenCategoryOptions(node.children || [], name)]
  })
}
