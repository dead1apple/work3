import test from 'node:test'
import assert from 'node:assert/strict'

import { filterCouponsByStatus, filterUsableCoupons, getCouponDiscountAmount, getCouponValueText, normalizeCouponList } from '../src/utils/coupon.js'

test('normalizes available coupon templates for claiming', () => {
  const result = normalizeCouponList({
    list: [{ id: 7, name: '平台满减券', amount: '30', minAmount: '199', startTime: '2026-08-01 00:00:00', endTime: '2026-08-31 23:59:59' }],
  }, 'available')

  assert.deepEqual(result.list[0], {
    id: 7,
    templateId: 7,
    name: '平台满减券',
    amount: 30,
    minAmount: 199,
    type: 1,
    status: null,
    statusText: '可领取',
    startTime: '2026-08-01',
    endTime: '2026-08-31',
    shopName: '京东商城平台券',
  })
  assert.equal(result.total, 1)
})

test('keeps the user coupon id while reading nested template details', () => {
  const result = normalizeCouponList({
    records: [{
      id: 91,
      templateId: 7,
      status: 0,
      couponTemplate: { id: 7, name: '数码专享券', amount: 50, minAmount: 500, type: 1, endTime: '2026-09-30' },
    }],
  }, 'mine')

  assert.equal(result.list[0].id, 91)
  assert.equal(result.list[0].templateId, 7)
  assert.equal(result.list[0].name, '数码专享券')
  assert.equal(result.list[0].statusText, '未使用')
})

test('filters my coupons with numeric status including zero', () => {
  const coupons = [{ id: 1, status: 0 }, { id: 2, status: 1 }, { id: 3, status: 2 }]
  assert.deepEqual(filterCouponsByStatus(coupons, 0).map((item) => item.id), [1])
  assert.deepEqual(filterCouponsByStatus(coupons, '').map((item) => item.id), [1, 2, 3])
})

test('keeps only unused coupons whose minimum amount is satisfied at checkout', () => {
  const coupons = [
    { id: 1, status: 0, minAmount: 100 },
    { id: 2, status: 0, minAmount: 500 },
    { id: 3, status: 1, minAmount: 0 },
  ]
  assert.deepEqual(filterUsableCoupons(coupons, 200).map((item) => item.id), [1])
})

test('formats and calculates percentage discount coupons', () => {
  const coupon = { type: 2, amount: 90 }
  assert.equal(getCouponValueText(coupon), '9折')
  assert.equal(getCouponDiscountAmount(coupon, 1000), 100)
  assert.equal(getCouponValueText({ type: 1, amount: 50 }), '¥50')
})
