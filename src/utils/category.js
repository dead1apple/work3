export const normalizeCategoryTree = (payload) => (Array.isArray(payload) ? payload : [])
  .map((node) => ({
    id: node?.category?.id,
    name: node?.category?.name || '未命名分类',
    children: normalizeCategoryTree(node?.children),
  }))
  .filter((category) => category.id)

export const getChildCategories = (category) => category?.children || []

export const normalizeCategoryProducts = (payload) => (payload?.list || [])
  .map((item) => ({
    id: item?.product?.id,
    title: item?.product?.name || '未命名商品',
    image: item?.product?.mainImage || '',
    price: Number(item?.minPrice ?? 0),
  }))
  .filter((product) => product.id)
