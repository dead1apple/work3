import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as orderApi from '../../../api/order'
import OrderListView from '../OrderListView.vue'

vi.mock('../../../api/order', () => ({ getMerchantOrders: vi.fn() }))

const orderPage = {
  total: 1,
  page: 1,
  size: 10,
  list: [{
    id: 110, orderNo: 'JD2092152692596604928', status: 1, totalAmount: 5498, payAmount: 5498,
    receiverName: 'wzg', receiverPhone: '17815552466', receiverAddress: '北京市市辖区西城区adsasdad1',
    createTime: '2026-08-25 15:30:46', payTime: '2026-08-25 15:30:50', deliveryTime: null,
  }],
}

describe('OrderListView', () => {
  beforeEach(() => vi.mocked(orderApi.getMerchantOrders).mockReset())

  it('renders actual merchant order fields without write or detail actions', async () => {
    vi.mocked(orderApi.getMerchantOrders).mockResolvedValue(orderPage)
    setActivePinia(createPinia())
    const wrapper = mount(OrderListView, { attachTo: document.body, global: { plugins: [createPinia()] } })
    await flushPromises()

    expect(wrapper.text()).toContain('JD2092152692596604928')
    expect(wrapper.text()).toContain('待发货')
    expect(wrapper.text()).toContain('¥5,498.00')
    expect(wrapper.text()).toContain('wzg')
    expect(wrapper.text()).not.toMatch(/订单详情|发货操作|取消订单/)
  })
})
