export const normalizeCategoryTree = (payload) => (Array.isArray(payload) ? payload : [])
  .map((node) => ({
    id: node?.category?.id,
    name: node?.category?.name || '未命名分类',
    children: normalizeCategoryTree(node?.children),
  }))
  .filter((category) => category.id)

export const getChildCategories = (category) => category?.children || []

export const flattenCategoryTree = (categories = [], depth = 0, parentId = null) => categories.flatMap((category) => {
  const current = { ...category, depth, parentId }
  return [current, ...flattenCategoryTree(category.children || [], depth + 1, category.id)]
})

export const selectFeaturedCategories = (categories = [], limit = 10) => {
  const allCategories = flattenCategoryTree(categories)
  const orderedCategories = [
    ...allCategories.filter((category) => !category.children?.length),
    ...allCategories.filter((category) => category.children?.length),
  ]
  const uniqueCategories = new Map()

  orderedCategories.forEach((category) => {
    if (category.id && !uniqueCategories.has(category.id)) uniqueCategories.set(category.id, category)
  })

  return Array.from(uniqueCategories.values()).slice(0, Math.max(0, limit))
}

const featuredCategoryVisuals = [
  { match: /手机/, icon: 'Iphone', tone: 'blue' },
  { match: /耳机/, icon: 'Headset', tone: 'green' },
  { match: /手表|手环/, icon: 'Watch', tone: 'purple' },
  { match: /笔记本/, icon: 'Notebook', tone: 'indigo' },
  { match: /台式|电脑/, icon: 'Monitor', tone: 'pink' },
  { match: /平板/, icon: 'Cellphone', tone: 'rose' },
  { match: /冰箱/, icon: 'Refrigerator', tone: 'cyan' },
  { match: /洗衣/, icon: 'Dish', tone: 'yellow' },
  { match: /空调/, icon: 'WindPower', tone: 'lime' },
  { match: /男装|女装|服装/, icon: 'Goods', tone: 'orange' },
]

export const resolveFeaturedCategoryVisual = (name) => {
  const visual = featuredCategoryVisuals.find(({ match }) => match.test(String(name || '')))
  return visual ? { icon: visual.icon, tone: visual.tone } : { icon: 'Goods', tone: 'orange' }
}

export const getProductCategoryTargets = (category) => {
  if (!category) return []
  return category.children?.length ? category.children : [category]
}

export const buildCategoryProductsRoute = (categoryId) => ({
  name: 'products',
  query: { categoryId },
})

export const normalizeCategoryProducts = (payload) => (payload?.list || [])
  .map((item) => ({
    id: item?.product?.id,
    title: item?.product?.name || '未命名商品',
    image: item?.product?.mainImage || '',
    price: Number(item?.minPrice ?? 0),
  }))
  .filter((product) => product.id)
