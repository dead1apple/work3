import test from 'node:test'
import assert from 'node:assert/strict'
import {
  flattenCategoryOptions,
  normalizeSearchQuery,
  serializeSearchQuery,
} from '../src/utils/productSearch.js'

test('normalizes search query values and rejects unsupported sorting', () => {
  assert.deepEqual(normalizeSearchQuery({ keyword: '  手机 ', categoryId: '12', brandId: '5', sortBy: 'price_desc', page: '3' }), {
    keyword: '手机', categoryId: 12, brandId: 5, sortBy: 'price_desc', page: 3, size: 12,
  })
  assert.equal(normalizeSearchQuery({ sortBy: 'priceDesc' }).sortBy, 'default')
})

test('serializes only meaningful search conditions into the URL', () => {
  assert.deepEqual(serializeSearchQuery({ keyword: '', categoryId: null, brandId: null, sortBy: 'default', page: 1, size: 12 }), {})
  assert.deepEqual(serializeSearchQuery({ keyword: '耳机', categoryId: 2, brandId: null, sortBy: 'sales', page: 2, size: 12 }), {
    keyword: '耳机', categoryId: '2', sortBy: 'sales', page: '2',
  })
})

test('flattens nested category nodes without losing hierarchy labels', () => {
  const result = flattenCategoryOptions([{ id: 1, name: '数码', children: [{ id: 2, name: '手机', children: [] }] }])
  assert.deepEqual(result, [{ id: 1, name: '数码' }, { id: 2, name: '数码 / 手机' }])
})
