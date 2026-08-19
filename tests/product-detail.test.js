import test from 'node:test'
import assert from 'node:assert/strict'

import {
  findSkuBySelection,
  getInitialSkuSelection,
  isSkuOptionAvailable,
  normalizeProductDetail,
} from '../src/utils/productDetail.js'

const skus = [
  { id: 11, specValues: '{"颜色":"黑","容量":"128G"}', stock: 3, price: 100 },
  { id: 12, specValues: '{"颜色":"白","容量":"256G"}', stock: 2, price: 200 },
]

test('does not fall back to the first SKU for an impossible combination', () => {
  const product = normalizeProductDetail({ product: { id: 1, name: '手机' }, skuList: skus })
  assert.equal(findSkuBySelection(product.skuList, { 颜色: '黑', 容量: '256G' }), null)
  assert.equal(isSkuOptionAvailable(product.skuList, { 颜色: '黑', 容量: '128G' }, '容量', '256G'), false)
})

test('chooses a real in-stock SKU for initial selection', () => {
  assert.deepEqual(getInitialSkuSelection(skus), { 颜色: '黑', 容量: '128G' })
})

test('keeps malformed SKU data unavailable without hiding the product', () => {
  const product = normalizeProductDetail({
    product: { id: 2, name: '耳机', mainImage: '/earbuds.png' },
    skuList: [
      { id: 21, specValues: '{bad-json', stock: 9, price: 99 },
      { id: 22, specValues: '{"颜色":"银"}', stock: 4, price: '199', marketPrice: '249' },
    ],
  })

  assert.equal(product.id, 2)
  assert.deepEqual(product.options, [{ label: '颜色', values: ['银'] }])
  assert.equal(product.skuList[0].available, false)
  assert.equal(findSkuBySelection(product.skuList, { 颜色: '银' }).id, 22)
})
