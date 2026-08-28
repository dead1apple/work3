import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCouponRouteQuery,
  filterCouponsByStatus,
  filterUsableCoupons,
  getCouponDiscountAmount,
  getCouponValueText,
  normalizeCouponList,
  normalizeCouponRouteState,
  runActiveCouponRouteLoad,
  shouldReplaceCouponRoute,
} from '../src/utils/coupon.js'
import * as couponUtils from '../src/utils/coupon.js'

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

test('normalizes the backend coupon view status field', () => {
  const result = normalizeCouponList([{
    userCouponId: 91,
    couponTemplateId: 7,
    userStatus: 0,
    name: '平台满减券',
    amount: 30,
    minAmount: 199,
  }], 'mine')

  assert.equal(result.list[0].id, 91)
  assert.equal(result.list[0].status, 0)
  assert.equal(result.list[0].statusText, '未使用')
})

test('joins bare user coupons with public template values instead of displaying zero', () => {
  const minePayload = [{ id: 91, couponTemplateId: 7, status: 0 }]
  const templates = normalizeCouponList([{ id: 7, name: '平台满 200 减 30 券', amount: 30, minAmount: 200, type: 1 }], 'available').list
  const result = normalizeCouponList(minePayload, 'mine', templates)

  assert.equal(result.list[0].id, 91)
  assert.equal(result.list[0].templateId, 7)
  assert.equal(result.list[0].name, '平台满 200 减 30 券')
  assert.equal(result.list[0].amount, 30)
  assert.equal(result.list[0].minAmount, 200)
  assert.equal(result.list[0].hasTemplateData, true)
})

test('does not present a user coupon with missing template data as a usable zero-value coupon', () => {
  const [coupon] = normalizeCouponList([{ id: 91, couponTemplateId: 999, status: 0 }], 'mine').list

  assert.equal(coupon.hasTemplateData, false)
  assert.equal(getCouponValueText(coupon), '优惠信息待同步')
  assert.deepEqual(filterUsableCoupons([coupon], 1000), [])
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

test('keeps platform and matching shop coupons for a single-shop checkout', () => {
  const coupons = [
    { id: 1, status: 0, minAmount: 100 },
    { id: 2, status: 0, minAmount: 100, shopId: 10 },
    { id: 3, status: 0, minAmount: 100, shopId: 20 },
  ]
  const items = [{ shopId: 10, price: 200, quantity: 1 }]

  assert.deepEqual(filterUsableCoupons(coupons, 200, items).map((item) => item.id), [1, 2])
})

test('excludes shop coupons when a checkout contains multiple shops', () => {
  const coupons = [
    { id: 1, status: 0, minAmount: 100 },
    { id: 2, status: 0, minAmount: 100, shopId: 10 },
  ]
  const items = [
    { shopId: 10, price: 100, quantity: 1 },
    { shopId: 20, price: 100, quantity: 1 },
  ]

  assert.deepEqual(filterUsableCoupons(coupons, 200, items).map((item) => item.id), [1])
})

test('lists only unclaimed templates applicable to the checkout for claiming', () => {
  const templates = [
    { id: 1, templateId: 1, minAmount: 100 },
    { id: 2, templateId: 2, minAmount: 100, shopId: 10 },
    { id: 3, templateId: 3, minAmount: 100, shopId: 20 },
    { id: 4, templateId: 4, minAmount: 500 },
  ]
  const claimedCoupons = [{ id: 91, templateId: 1, status: 0 }]
  const items = [{ shopId: 10, price: 200, quantity: 1 }]

  assert.equal(typeof couponUtils.filterClaimableCouponTemplates, 'function')
  assert.deepEqual(couponUtils.filterClaimableCouponTemplates(templates, claimedCoupons, 200, items).map((item) => item.templateId), [2])
})

test('formats and calculates percentage discount coupons', () => {
  const coupon = { type: 2, amount: 90 }
  assert.equal(getCouponValueText(coupon), '9折')
  assert.equal(getCouponDiscountAmount(coupon, 1000), 100)
  assert.equal(getCouponValueText({ type: 1, amount: 50 }), '¥50')
})

test('returns no discount for malformed percentage rates', () => {
  assert.equal(getCouponDiscountAmount({ type: 2, amount: -1 }, 100), 0)
  assert.equal(getCouponDiscountAmount({ type: 2, amount: Infinity }, 100), 0)
})

test('coupon route query sync avoids replace loops and strips inactive status', () => {
  const current = { tab: 'mine', status: '0' }
  assert.equal(shouldReplaceCouponRoute(current, buildCouponRouteQuery(current, 'mine', '0')), false)

  const availableQuery = buildCouponRouteQuery({ tab: 'mine', status: '2', ref: 'account' }, 'available', '2')
  assert.deepEqual(availableQuery, { tab: 'available', ref: 'account' })
  assert.equal(shouldReplaceCouponRoute({ tab: 'mine', status: '2', ref: 'account' }, availableQuery), true)
})

test('coupon route loading calls only the active normalized tab', async () => {
  const calls = []
  await runActiveCouponRouteLoad({
    routeState: normalizeCouponRouteState({ tab: 'available', status: '1' }),
    loadAvailable: async () => calls.push(['available']),
    loadMine: async () => calls.push(['mine']),
  })
  await runActiveCouponRouteLoad({
    routeState: normalizeCouponRouteState({ tab: 'mine', status: '0' }),
    loadAvailable: async () => calls.push(['available']),
    loadMine: async (status) => calls.push(['mine', status]),
  })

  assert.deepEqual(calls, [['available'], ['mine', '0']])
})
