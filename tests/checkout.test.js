import test from 'node:test'
import assert from 'node:assert/strict'

import { buildBuyNowPayload, createCheckoutSubmissionOutcome, extractOrderNo, normalizeBuyNowItem, parseBuyNowQuery } from '../src/utils/checkout.js'

test('parses and constrains buy-now query parameters', () => {
  assert.deepEqual(parseBuyNowQuery({ productId: '8', skuId: '81', quantity: '120' }), {
    productId: 8,
    skuId: 81,
    quantity: 99,
  })
  assert.throws(() => parseBuyNowQuery({ productId: 'x', skuId: '81' }), /商品参数无效/)
})

test('normalizes the selected SKU into a checkout item', () => {
  const item = normalizeBuyNowItem({
    product: { id: 8, name: '旗舰手机', mainImage: '/phone.png' },
    skuList: [
      { id: 80, skuName: '标准版', price: 2999, stock: 3 },
      { id: 81, skuName: '曜石黑 512GB', specValues: '{"颜色":"曜石黑","容量":"512GB"}', price: '3999', marketPrice: '4299', stock: 6, image: '/black.png' },
    ],
  }, { skuId: 81, quantity: 8 })

  assert.deepEqual(item, {
    productId: 8,
    skuId: 81,
    name: '旗舰手机',
    image: '/black.png',
    skuName: '曜石黑 512GB',
    specText: '曜石黑 / 512GB',
    price: 3999,
    marketPrice: 4299,
    stock: 6,
    quantity: 6,
  })
})

test('builds only fields supported by the buy-now endpoint', () => {
  assert.deepEqual(buildBuyNowPayload({
    item: { skuId: 81, quantity: 2 },
    addressId: '9',
    couponId: 7,
    remark: '  周末送达  ',
  }), {
    skuId: 81,
    quantity: 2,
    addressId: 9,
    remark: '周末送达',
  })
})

test('extracts an order number from supported order responses', () => {
  assert.equal(extractOrderNo({ order: { orderNo: 'JD2026001' } }), 'JD2026001')
  assert.equal(extractOrderNo({ orderNo: 'JD2026002' }), 'JD2026002')
  assert.equal(extractOrderNo('JD2026003'), 'JD2026003')
})

test('successful checkout response is terminal even without an order number', () => {
  assert.deepEqual(createCheckoutSubmissionOutcome({}), {
    orderNo: '',
    terminal: true,
  })
})
