let nextSkuKey = 1

function optionalText(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || null
}

function hasNumber(value) {
  return value !== '' && value !== null && value !== undefined
}

function isNonNegativeNumber(value) {
  if (!hasNumber(value)) return false
  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}

function parseSpecObject(value) {
  try {
    const parsed = JSON.parse(typeof value === 'string' ? value.trim() : '')
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
      return { error: '规格值必须是 JSON 对象' }
    }
    return { value: parsed }
  } catch {
    return { error: '规格值必须是有效 JSON 对象' }
  }
}

export function createSkuRow() {
  return {
    key: nextSkuKey++,
    skuName: '',
    specValues: '{}',
    price: null,
    marketPrice: null,
    stock: 0,
    image: '',
  }
}

export function createProductForm() {
  return {
    name: '',
    subtitle: '',
    categoryPath: [],
    brandId: null,
    mainImage: '',
    imageUrls: '',
    detail: '',
    skuList: [createSkuRow()],
  }
}

export function toCategoryOptions(nodes) {
  return nodes.map(({ category, children }) => {
    const option = {
      value: category.id,
      label: category.name,
    }

    if (children.length > 0) {
      option.children = toCategoryOptions(children)
    }

    return option
  })
}

export function parseImageUrls(value) {
  if (typeof value !== 'string') return []
  return value
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
}

export function validateProductForm(form) {
  const errors = {}

  if (!form.name?.trim()) errors.name = '请输入商品名称'
  if (!Array.isArray(form.categoryPath) || form.categoryPath.length === 0) {
    errors.categoryPath = '请选择叶子分类'
  }
  if (!hasNumber(form.brandId)) errors.brandId = '请选择品牌'

  if (!Array.isArray(form.skuList) || form.skuList.length === 0) {
    errors.skuList = '至少添加一个 SKU'
    return errors
  }

  form.skuList.forEach((sku, index) => {
    const prefix = `skuList.${index}`
    if (!sku.skuName?.trim()) errors[`${prefix}.skuName`] = '请输入 SKU 名称'

    const specification = parseSpecObject(sku.specValues)
    if (specification.error) errors[`${prefix}.specValues`] = specification.error

    if (!isNonNegativeNumber(sku.price)) {
      errors[`${prefix}.price`] = '销售价必须是非负数字'
    }
    if (hasNumber(sku.marketPrice) && !isNonNegativeNumber(sku.marketPrice)) {
      errors[`${prefix}.marketPrice`] = '市场价必须是非负数字'
    }

    const stock = Number(sku.stock)
    if (!hasNumber(sku.stock) || !Number.isInteger(stock) || stock < 0) {
      errors[`${prefix}.stock`] = '库存必须是非负整数'
    }
  })

  return errors
}

export function buildProductPayload(form) {
  return {
    categoryId: Number(form.categoryPath.at(-1)),
    brandId: Number(form.brandId),
    name: form.name.trim(),
    subtitle: optionalText(form.subtitle),
    mainImage: optionalText(form.mainImage),
    images: parseImageUrls(form.imageUrls),
    detail: optionalText(form.detail),
    skuList: form.skuList.map((sku) => ({
      skuName: sku.skuName.trim(),
      specValues: JSON.stringify(parseSpecObject(sku.specValues).value),
      price: Number(sku.price),
      marketPrice: hasNumber(sku.marketPrice) ? Number(sku.marketPrice) : null,
      stock: Number(sku.stock),
      image: optionalText(sku.image),
    })),
  }
}
