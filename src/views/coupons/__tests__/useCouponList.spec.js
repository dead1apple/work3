import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as couponApi from '../../../api/coupon'
import { useCouponList } from '../useCouponList'

vi.mock('../../../api/coupon', () => ({ getMerchantCoupons: vi.fn(), updateMerchantCouponStatus: vi.fn() }))

const couponPage = {
  total: 1,
  list: [{ id: 6, name: '华为店 9 折折扣券', type: 2, amount: 90, status: 1 }],
  page: 1,
  size: 10,
}

describe('useCouponList', () => {
  beforeEach(() => {
    vi.mocked(couponApi.getMerchantCoupons).mockReset()
    vi.mocked(couponApi.updateMerchantCouponStatus).mockReset()
  })

  it('uses server keyword and status filters, returning to page one', async () => {
    vi.mocked(couponApi.getMerchantCoupons).mockResolvedValue(couponPage)
    const state = useCouponList()
    state.keyword.value = '华为'
    state.status.value = 1
    state.page.value = 3

    await state.search()

    expect(couponApi.getMerchantCoupons).toHaveBeenCalledWith({ keyword: '华为', status: 1, page: 1, size: 10 })
  })

  it('omits status and blank keyword for the all-status server query', async () => {
    vi.mocked(couponApi.getMerchantCoupons).mockResolvedValue(couponPage)
    const state = useCouponList()
    state.page.value = 3
    state.keyword.value = '  '

    await state.changeStatus('')

    expect(couponApi.getMerchantCoupons).toHaveBeenCalledWith({ page: 1, size: 10 })
  })

  it('reloads the server page after a status change without locally changing rows', async () => {
    const refreshed = { ...couponPage, list: [{ ...couponPage.list[0], status: 0 }] }
    vi.mocked(couponApi.getMerchantCoupons).mockResolvedValueOnce(couponPage).mockResolvedValueOnce(refreshed)
    vi.mocked(couponApi.updateMerchantCouponStatus).mockResolvedValue({})
    const state = useCouponList()
    await state.load()

    await state.updateStatus(6, 0)

    expect(couponApi.updateMerchantCouponStatus).toHaveBeenCalledWith(6, 0)
    expect(couponApi.getMerchantCoupons).toHaveBeenCalledTimes(2)
    expect(state.items.value[0].status).toBe(0)
  })

  it('keeps displayed rows intact and releases loading after a failed status change', async () => {
    const failure = new Error('优惠券不可停用')
    vi.mocked(couponApi.getMerchantCoupons).mockResolvedValue(couponPage)
    vi.mocked(couponApi.updateMerchantCouponStatus).mockRejectedValue(failure)
    const state = useCouponList()
    await state.load()

    await expect(state.updateStatus(6, 0)).rejects.toBe(failure)

    expect(state.items.value[0].status).toBe(1)
    expect(state.updatingCouponIds.value.has(6)).toBe(false)
  })
})
