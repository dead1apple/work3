import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, it, vi } from 'vitest'
import CouponListView from '../CouponListView.vue'

vi.mock('../../../api/coupon', () => ({
  createMerchantCoupon: vi.fn(),
  getMerchantCoupon: vi.fn(),
  getMerchantCoupons: vi.fn().mockResolvedValue({ total: 0, list: [], page: 1, size: 10 }),
  getMerchantCouponStatistics: vi.fn(),
  getMerchantCouponUsers: vi.fn(),
  updateMerchantCoupon: vi.fn(),
  updateMerchantCouponStatus: vi.fn(),
}))

describe('CouponListView', () => {
  it('uses calendar time pickers for the required coupon validity period', async () => {
    const wrapper = mount(CouponListView, { global: { plugins: [ElementPlus] } })
    await wrapper.get('[data-testid="create-coupon"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('input[placeholder="请选择开始时间"]').exists()).toBe(true)
    expect(wrapper.get('input[placeholder="请选择结束时间"]').exists()).toBe(true)
  })
})
