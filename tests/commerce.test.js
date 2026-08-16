import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateCheckoutTotals,
  normalizeAddressList,
  normalizeOrderList,
  normalizeProductList,
} from '../src/utils/commerce.js'

test('normalizes addresses and puts the default address first', () => {
  const addresses = normalizeAddressList([
    { id: 2, receiverName: '李四', receiverPhone: '13900000000', detailAddress: '浦东新区', isDefault: 0 },
    { id: 1, receiverName: '张三', receiverPhone: '13800000000', province: '上海', city: '上海', detailAddress: '徐汇区', isDefault: 1 },
  ])

  assert.equal(addresses[0].id, 1)
  assert.equal(addresses[0].fullAddress, '上海上海徐汇区')
  assert.equal(addresses[1].isDefault, false)
})

test('normalizes paged product and order responses', () => {
  assert.deepEqual(normalizeProductList({ list: [{ product: { id: 8, name: '耳机', mainImage: '/a.png' }, minPrice: 99 }], total: 1 }), {
    list: [{ id: 8, title: '耳机', image: '/a.png', price: 99, sales: 0 }], total: 1,
  })
  assert.equal(normalizeOrderList({ list: [{ orderNo: 'JD1', status: 1, totalAmount: 88 }], total: 1 }).list[0].statusText, '待付款')
})

test('calculates checkout amounts with a coupon without producing a negative payable', () => {
  assert.deepEqual(calculateCheckoutTotals([{ price: 20, quantity: 2 }, { price: 10, quantity: 1 }], { amount: 60 }), {
    goodsAmount: 50, discountAmount: 50, payableAmount: 0, totalCount: 3,
  })
})

test('calculates checkout totals for a percentage discount coupon', () => {
  const totals = calculateCheckoutTotals([{ price: 1000, quantity: 1 }], { type: 2, amount: 90 })
  assert.equal(totals.discountAmount, 100)
  assert.equal(totals.payableAmount, 900)
})
