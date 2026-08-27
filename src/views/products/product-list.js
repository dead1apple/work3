const PRODUCT_STATUS = Object.freeze({
  0: Object.freeze({ label: '已下架', type: 'info' }),
  1: Object.freeze({ label: '已上架', type: 'success' }),
  2: Object.freeze({ label: '待审核', type: 'warning' }),
})

export const PRODUCT_STATUS_OPTIONS = Object.freeze([
  Object.freeze({ label: '全部状态', value: '' }),
  Object.freeze({ label: '已下架', value: 0 }),
  Object.freeze({ label: '已上架', value: 1 }),
  Object.freeze({ label: '待审核', value: 2 }),
])

export function getProductStatus(status) {
  return PRODUCT_STATUS[status] || { label: '未知状态', type: 'info' }
}

function formatCurrency(value) {
  return `¥${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPriceRange(minPrice, maxPrice) {
  if (Number(minPrice) === Number(maxPrice)) {
    return formatCurrency(minPrice)
  }

  return `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`
}
