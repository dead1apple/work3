import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildBuyNowPayload,
  completeCheckoutSuccess,
  createCheckoutSubmissionOutcome,
  extractOrderNo,
  normalizeBuyNowItem,
  parseBuyNowQuery,
  refreshCartAfterCheckout,
} from '../src/utils/checkout.js'
import * as checkoutUtils from '../src/utils/checkout.js'

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

test('builds a cart order payload from canonical server cart ids', () => {
  assert.equal(typeof checkoutUtils.buildCartOrderPayload, 'function')
  assert.deepEqual(checkoutUtils.buildCartOrderPayload({
    items: [{ id: 44 }, { id: 51 }],
    addressId: '9',
    couponId: '7',
    remark: '  工作日送达  ',
  }), {
    cartIds: [44, 51],
    addressId: 9,
    couponId: 7,
    remark: '工作日送达',
  })
  assert.throws(() => checkoutUtils.buildCartOrderPayload({ items: [{ id: null }], addressId: 9 }), /购物车数据异常/)
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

test('checkout success remains terminal when payment navigation fails', async () => {
  const events = []

  const outcome = await completeCheckoutSuccess({
    result: { orderNo: 'JD2026009' },
    payableAmount: 109,
    onTerminal: (terminalOutcome) => events.push(['terminal', terminalOutcome.terminal, terminalOutcome.orderNo]),
    replace: async (target) => {
      events.push(['navigate', target.path, target.query.amount])
      throw new Error('navigation blocked')
    },
    notify: {
      success: (message) => events.push(['success', message]),
      warning: (message) => events.push(['warning', message]),
    },
  })

  assert.equal(outcome.terminal, true)
  assert.equal(outcome.navigationFailed, true)
  assert.deepEqual(events[0], ['terminal', true, 'JD2026009'])
  assert.deepEqual(events.at(-1), ['warning', '订单已创建，但页面跳转失败，请前往我的订单查看'])
})

test('refreshes canonical cart state only after a cart checkout', async () => {
  const calls = []
  const refreshCart = async () => calls.push('refresh')

  assert.equal(await refreshCartAfterCheckout({ isBuyNow: true, refreshCart }), false)
  assert.equal(await refreshCartAfterCheckout({ isBuyNow: false, refreshCart }), true)
  assert.deepEqual(calls, ['refresh'])
})

test('cart refresh failure does not turn a created order into a submission failure', async () => {
  const result = await refreshCartAfterCheckout({
    isBuyNow: false,
    refreshCart: async () => { throw new Error('cart unavailable') },
  })

  assert.equal(result, false)
})
