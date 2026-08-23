import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createRequestGenerationGate,
  findSkuBySelection,
  getInitialSkuSelection,
  isSkuOptionAvailable,
  normalizeProductDetail,
} from '../src/utils/productDetail.js'
import * as productDetailUtils from '../src/utils/productDetail.js'

const skus = [
  { id: 11, specValues: '{"颜色":"黑","容量":"128G"}', stock: 3, price: 100 },
  { id: 12, specValues: '{"颜色":"白","容量":"256G"}', stock: 2, price: 200 },
]

test('does not fall back to the first SKU for an impossible combination', () => {
  const product = normalizeProductDetail({ product: { id: 1, name: '手机' }, skuList: skus })
  assert.equal(findSkuBySelection(product.skuList, { 颜色: '黑', 容量: '256G' }), null)
  assert.equal(isSkuOptionAvailable(product.skuList, { 颜色: '黑', 容量: '128G' }, '容量', '256G'), false)
})

test('keeps earlier SKU options reachable while rejecting impossible later options', () => {
  const product = normalizeProductDetail({ product: { id: 1, name: '手机' }, skuList: skus })

  assert.equal(isSkuOptionAvailable(product.skuList, { 颜色: '黑', 容量: '128G' }, '颜色', '白'), true)
  assert.equal(isSkuOptionAvailable(product.skuList, { 颜色: '黑', 容量: '128G' }, '容量', '256G'), false)
  assert.equal(isSkuOptionAvailable(product.skuList, { 颜色: '白', 容量: '128G' }, '容量', '256G'), true)
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

test('parses comma-separated product images, removes duplicates and limits the gallery to eight', () => {
  assert.equal(typeof productDetailUtils.normalizeProductImages, 'function')
  const images = productDetailUtils.normalizeProductImages(
    '/main.png',
    '/one.png,/two.png,/main.png,/three.png,/four.png,/five.png,/six.png,/seven.png,/eight.png,/nine.png',
  )

  assert.deepEqual(images, ['/main.png', '/one.png', '/two.png', '/three.png', '/four.png', '/five.png', '/six.png', '/seven.png'])
  assert.equal(images.every((image) => image.length > 1), true)

  const product = normalizeProductDetail({ product: { id: 69, name: '安踏 综训鞋 运动鞋', mainImage: '/main.png', images: '/one.png,/two.png' } })
  assert.deepEqual(product.images, ['/main.png', '/one.png', '/two.png'])
})

test('request generation gate blocks stale commits while allowing the latest generation', () => {
  const gate = createRequestGenerationGate()
  const committed = []
  const first = gate.next()
  const second = gate.next()

  assert.equal(first.commit(() => committed.push('stale-product')), false)
  assert.equal(second.commit(() => committed.push('latest-product')), true)
  assert.deepEqual(committed, ['latest-product'])
})
