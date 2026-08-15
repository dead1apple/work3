import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getChildCategories,
  normalizeCategoryProducts,
  normalizeCategoryTree,
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
