import { describe, expect, it } from 'vitest'
import { createCouponForm, toMerchantCouponPayload, validateCouponPayload } from '../coupon-payload'

describe('merchant coupon payload', () => {
  it('creates the documented MerchantCouponRequest without shopId or response-only fields', () => {
    const payload = toMerchantCouponPayload(createCouponForm({
      id: 6, shopId: 1, issuedCount: 2, usedCount: 1,
      name: '测试券', type: 1, amount: 20, minAmount: 100, totalCount: 10,
      startTime: '2026-08-28 00:00:00', endTime: '2026-08-29 23:59:59', status: 0,
    }))

    expect(payload).toEqual({
      name: '测试券', type: 1, amount: 20, minAmount: 100, totalCount: 10,
      startTime: '2026-08-28 00:00:00', endTime: '2026-08-29 23:59:59', status: 0,
    })
    expect(payload).not.toHaveProperty('shopId')
    expect(payload).not.toHaveProperty('issuedCount')
    expect(payload).not.toHaveProperty('usedCount')
  })

  it('keeps optional documented fields only when supplied', () => {
    const payload = toMerchantCouponPayload(createCouponForm({
      name: '测试券', type: 2, amount: 90, minAmount: 1000, totalCount: 10,
      startTime: '2026-08-28 00:00:00', endTime: '2026-08-29 23:59:59', status: 1,
      receiveStartTime: '2026-08-28 00:00:00', perUserLimit: 1, maxDiscountAmount: 50,
    }))

    expect(payload).toMatchObject({ receiveStartTime: '2026-08-28 00:00:00', perUserLimit: 1, maxDiscountAmount: 50 })
  })

  it('rejects invalid documented boundaries before submitting', () => {
    expect(validateCouponPayload({
      name: '测试券', type: 1, amount: 0, minAmount: 0, totalCount: 1,
      startTime: '2026-08-29 00:00:00', endTime: '2026-08-28 00:00:00', status: 1,
    })).toBe('优惠值必须不小于 0.01')
  })
})
