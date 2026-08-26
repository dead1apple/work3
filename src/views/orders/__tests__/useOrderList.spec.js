import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as orderApi from '../../../api/order'
import { useOrderList } from '../useOrderList'

vi.mock('../../../api/order', () => ({ getMerchantOrders: vi.fn() }))

const orderPage = {
  total: 1,
  list: [{ id: 110, orderNo: 'JD2092152692596604928', status: 1, payAmount: 5498 }],
  page: 1,
  size: 10,
}

describe('useOrderList', () => {
  beforeEach(() => vi.mocked(orderApi.getMerchantOrders).mockReset())

  it('loads filtered server pages with documented query parameters only', async () => {
    vi.mocked(orderApi.getMerchantOrders).mockResolvedValue(orderPage)
    const state = useOrderList()
    state.status.value = 1
    state.page.value = 3

    await state.search()

    expect(orderApi.getMerchantOrders).toHaveBeenCalledWith({ status: 1, page: 1, size: 10 })
    expect(state.items.value).toEqual(orderPage.list)
    expect(state.total.value).toBe(1)
  })

  it('clears stale orders and exposes errors for retry', async () => {
    const failure = new Error('orders unavailable')
    vi.mocked(orderApi.getMerchantOrders).mockResolvedValueOnce(orderPage).mockRejectedValueOnce(failure)
    const state = useOrderList()
    await state.load()

    await expect(state.load()).rejects.toBe(failure)

    expect(state.items.value).toEqual([])
    expect(state.total.value).toBe(0)
    expect(state.error.value).toBe(failure)
    expect(state.loading.value).toBe(false)
  })
})
