import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as orderApi from '../../../api/order'
import { useOrderList } from '../useOrderList'

vi.mock('../../../api/order', () => ({ getMerchantOrders: vi.fn(), deliverMerchantOrder: vi.fn() }))

const orderPage = {
  total: 1,
  list: [{ id: 110, orderNo: 'JD2092152692596604928', status: 1, payAmount: 5498 }],
  page: 1,
  size: 10,
}

describe('useOrderList', () => {
  beforeEach(() => {
    vi.mocked(orderApi.getMerchantOrders).mockReset()
    vi.mocked(orderApi.deliverMerchantOrder).mockReset()
  })

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

  it('returns to page one and omits status when the all-status option is selected', async () => {
    vi.mocked(orderApi.getMerchantOrders).mockResolvedValue(orderPage)
    const state = useOrderList()
    state.page.value = 3

    await state.changeStatus('')

    expect(orderApi.getMerchantOrders).toHaveBeenCalledWith({ page: 1, size: 10 })
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

  it('refreshes from the server after delivering one order without local status mutation', async () => {
    const refreshedPage = {
      ...orderPage,
      list: [{ ...orderPage.list[0], status: 2 }],
    }
    vi.mocked(orderApi.getMerchantOrders)
      .mockResolvedValueOnce(orderPage)
      .mockResolvedValueOnce(refreshedPage)
    vi.mocked(orderApi.deliverMerchantOrder).mockResolvedValue({})
    const state = useOrderList()
    await state.load()

    await state.deliver({ orderNo: 'JD2092152692596604928', logisticsNo: 'SF1', logisticsCompany: '顺丰快递' })

    expect(orderApi.deliverMerchantOrder).toHaveBeenCalledWith({ orderNo: 'JD2092152692596604928', logisticsNo: 'SF1', logisticsCompany: '顺丰快递' })
    expect(orderApi.getMerchantOrders).toHaveBeenCalledTimes(2)
    expect(state.items.value[0].status).toBe(2)
  })

  it('rejects a failed delivery while leaving displayed order state intact', async () => {
    const failure = new Error('订单不可发货')
    vi.mocked(orderApi.getMerchantOrders).mockResolvedValue(orderPage)
    vi.mocked(orderApi.deliverMerchantOrder).mockRejectedValue(failure)
    const state = useOrderList()
    await state.load()

    await expect(state.deliver({ orderNo: 'JD2092152692596604928', logisticsNo: 'SF1', logisticsCompany: '顺丰快递' })).rejects.toBe(failure)

    expect(state.items.value[0].status).toBe(1)
    expect(state.deliveringOrderNos.value.has('JD2092152692596604928')).toBe(false)
  })

  it('ignores a repeated delivery request for the same order while pending', async () => {
    let resolveDelivery
    vi.mocked(orderApi.getMerchantOrders).mockResolvedValue(orderPage)
    vi.mocked(orderApi.deliverMerchantOrder).mockReturnValue(new Promise((resolve) => { resolveDelivery = resolve }))
    const state = useOrderList()
    await state.load()
    const payload = { orderNo: 'JD2092152692596604928', logisticsNo: 'SF1', logisticsCompany: '顺丰快递' }

    const first = state.deliver(payload)
    const second = state.deliver(payload)

    expect(orderApi.deliverMerchantOrder).toHaveBeenCalledOnce()
    resolveDelivery({})
    await Promise.all([first, second])
  })
})
