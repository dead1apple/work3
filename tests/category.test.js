import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCategoryProductsRoute,
  flattenCategoryTree,
  getChildCategories,
  getProductCategoryTargets,
  normalizeCategoryProducts,
  normalizeCategoryTree,
  resolveFeaturedCategoryVisual,
  selectFeaturedCategories,
} from '../src/utils/category.js'

test('normalizes category tree nodes into navigation-ready categories', () => {
  const categories = normalizeCategoryTree([{
    category: { id: 1, name: '手机数码' },
    children: [{ category: { id: 11, name: '手机' }, children: [] }],
  }])

  assert.deepEqual(categories, [{
    id: 1,
    name: '手机数码',
    children: [{ id: 11, name: '手机', children: [] }],
  }])
  assert.deepEqual(getChildCategories(categories[0]), [{ id: 11, name: '手机', children: [] }])
})

test('normalizes product list results into display-ready recommendations', () => {
  const products = normalizeCategoryProducts({
    list: [{ product: { id: 8, name: '无线耳机', mainImage: '/earphones.png' }, minPrice: 299 }],
  })

  assert.deepEqual(products, [{ id: 8, title: '无线耳机', image: '/earphones.png', price: 299 }])
})

test('flattens all category levels with navigation metadata', () => {
  const children = [{ id: 11, name: '手机', children: [] }]
  const tree = [{ id: 1, name: '数码', children }]

  assert.deepEqual(flattenCategoryTree(tree), [
    { id: 1, name: '数码', children, depth: 0, parentId: null },
    { id: 11, name: '手机', children: [], depth: 1, parentId: 1 },
  ])
})

test('selects real leaf categories first for the home shortcuts', () => {
  const tree = [
    { id: 1, name: '数码', children: [{ id: 11, name: '手机', children: [] }, { id: 12, name: '电脑', children: [] }] },
    { id: 2, name: '图书', children: [] },
    { id: 2, name: '重复图书', children: [] },
  ]

  assert.deepEqual(selectFeaturedCategories(tree, 2).map(({ id }) => id), [11, 12])
  assert.deepEqual(selectFeaturedCategories(tree, 10).map(({ id }) => id), [11, 12, 2, 1])
})

test('chooses child IDs for a parent and its own ID for a leaf', () => {
  const leaf = { id: 11, name: '手机', children: [] }
  const parent = { id: 1, name: '数码', children: [leaf, { id: 12, name: '电脑', children: [] }] }

  assert.deepEqual(getProductCategoryTargets(parent).map(({ id }) => id), [11, 12])
  assert.deepEqual(getProductCategoryTargets(leaf).map(({ id }) => id), [11])
  assert.deepEqual(getProductCategoryTargets(null), [])
})

test('builds the filtered product route from a real category ID', () => {
  assert.deepEqual(buildCategoryProductsRoute(11), {
    name: 'products',
    query: { categoryId: 11 },
  })
})

test('assigns semantic visuals to the featured category names instead of their position', () => {
  assert.deepEqual(resolveFeaturedCategoryVisual('手机'), { icon: 'Iphone', tone: 'blue' })
  assert.deepEqual(resolveFeaturedCategoryVisual('耳机'), { icon: 'Headset', tone: 'green' })
  assert.deepEqual(resolveFeaturedCategoryVisual('智能手表'), { icon: 'Watch', tone: 'purple' })
  assert.deepEqual(resolveFeaturedCategoryVisual('笔记本'), { icon: 'Notebook', tone: 'indigo' })
  assert.deepEqual(resolveFeaturedCategoryVisual('冰箱'), { icon: 'Refrigerator', tone: 'cyan' })
  assert.deepEqual(resolveFeaturedCategoryVisual('新分类'), { icon: 'Goods', tone: 'orange' })
})
