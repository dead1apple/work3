import { toBoundedPositiveInteger, toNonNegativeMoney, unwrapData } from './response.js'

const parseSpecs = (specValues) => {
  if (specValues && typeof specValues === 'object' && !Array.isArray(specValues)) return specValues
  const parsed = JSON.parse(specValues || '{}')
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

const normalizeSku = (sku) => {
  try {
    const specs = parseSpecs(sku?.specValues)
    return {
      ...sku,
      specs,
      stock: toBoundedPositiveInteger(sku?.stock, { fallback: 0, max: Number.MAX_SAFE_INTEGER }),
      price: toNonNegativeMoney(sku?.price, 0),
      marketPrice: toNonNegativeMoney(sku?.marketPrice, 0),
      available: Object.keys(specs).length > 0,
    }
  } catch {
    return {
      ...sku,
      specs: {},
      stock: 0,
      price: toNonNegativeMoney(sku?.price, 0),
      marketPrice: toNonNegativeMoney(sku?.marketPrice, 0),
      available: false,
    }
  }
}

const hasExactSelection = (sku, selection = {}) => {
  const entries = Object.entries(selection)
  const specEntries = Object.entries(sku.specs || {})
  return (
    sku.available &&
    entries.length === specEntries.length &&
    entries.every(([label, value]) => sku.specs[label] === value)
  )
}

export function normalizeProductDetail(payload) {
  const source = unwrapData(payload) ?? {}
  const raw = source?.product || source
  const skuList = (source?.skuList || raw?.skuList || []).map(normalizeSku)
  const optionMap = new Map()

  skuList.forEach((sku) => {
    if (!sku.available) return
    Object.entries(sku.specs).forEach(([label, value]) => {
      if (!optionMap.has(label)) optionMap.set(label, [])
      const optionValues = optionMap.get(label)
      if (!optionValues.includes(value)) optionValues.push(value)
    })
  })

  const prices = skuList.filter((sku) => sku.available).map((sku) => sku.price).filter(Number.isFinite)
  const marketPrices = skuList.filter((sku) => sku.available).map((sku) => sku.marketPrice).filter(Number.isFinite)

  return {
    id: raw.id,
    title: raw.name || raw.title || '未命名商品',
    subtitle: raw.subtitle || '',
    price: prices.length ? Math.min(...prices) : 0,
    originalPrice: marketPrices.length ? Math.max(...marketPrices) : 0,
    sales: raw.salesCount || raw.sales || 0,
    reviewCount: 0,
    images: [raw.mainImage, ...(raw.images || [])].filter(Boolean),
    detail: raw.detail || '暂无商品详情描述。',
    options: Array.from(optionMap, ([label, values]) => ({ label, values })),
    skuList,
    reviews: [],
  }
}

export function findSkuBySelection(skuList = [], selection = {}) {
  const entries = Object.entries(selection)
  if (!entries.length) return null
  return skuList.find((sku) => hasExactSelection(sku, selection)) || null
}

export function isSkuOptionAvailable(skuList = [], selection = {}, label, value) {
  return Boolean(findSkuBySelection(skuList, { ...selection, [label]: value }))
}

export function getInitialSkuSelection(skuList = []) {
  const normalizedSkus = skuList.map((sku) => (sku?.specs ? sku : normalizeSku(sku)))
  const sku = normalizedSkus.find((item) => item.available && item.stock > 0)
  return sku ? { ...sku.specs } : {}
}
