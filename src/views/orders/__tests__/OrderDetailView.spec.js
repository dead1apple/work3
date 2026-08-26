import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import * as orderApi from '../../../api/order'
import OrderDetailView from '../OrderDetailView.vue'

vi.mock('../../../api/order', () => ({ getMerchantOrderDetail: vi.fn() }))

const detail = {
  order: {
    id: 110, orderNo: 'JD2092152692596604928', status: 2, totalAmount: 5498, payAmount: 5398,
    freightAmount: 0, discountAmount: 100, receiverName: 'wzg', receiverPhone: '17815552466',
    receiverAddress: '北京市市辖区西城区测试地址', createTime: '2026-08-25 15:30:46',
    payTime: '2026-08-25 15:30:50', deliveryTime: '2026-08-25 16:00:00', receiveTime: null,
    logisticsCompany: '顺丰快递', logisticsNo: 'SF1234567890', payType: 1,
  },
  items: [{ id: 1, productName: '华为 Mate 60 Pro', skuName: '曜石黑 256GB', price: 5498, quantity: 1, totalAmount: 5498 }],
  payment: { paymentNo: 'PAY001', amount: 5398, status: 1, payType: 1, payTime: '2026-08-25 15:30:50' },
}

async function mountDetail() {
  const router = createRouter({
    history: createMemoryHistory('/merchant/'),
    routes: [
      { path: '/orders', name: 'merchant-orders', component: { template: '<div />' } },
      { path: '/orders/:orderNo', name: 'merchant-order-detail', component: { template: '<div />' } },
    ],
  })
  await router.push('/orders/JD2092152692596604928')
  return mount(OrderDetailView, { attachTo: document.body, global: { plugins: [router] } })
}

describe('OrderDetailView', () => {
  beforeEach(() => vi.mocked(orderApi.getMerchantOrderDetail).mockReset())

  it('renders merchant detail fields returned by the dedicated endpoint', async () => {
    vi.mocked(orderApi.getMerchantOrderDetail).mockResolvedValue(detail)
    const wrapper = await mountDetail()
    await flushPromises()

    expect(orderApi.getMerchantOrderDetail).toHaveBeenCalledWith('JD2092152692596604928')
    expect(wrapper.text()).toContain('JD2092152692596604928')
    expect(wrapper.text()).toContain('待收货')
    expect(wrapper.text()).toContain('华为 Mate 60 Pro')
    expect(wrapper.text()).toContain('¥5,398.00')
    expect(wrapper.text()).toContain('北京市市辖区西城区测试地址')
    expect(wrapper.text()).toContain('顺丰快递')
  })

  it('clears partial data and retries the dedicated detail request after failure', async () => {
    vi.mocked(orderApi.getMerchantOrderDetail)
      .mockRejectedValueOnce(new Error('订单不存在'))
      .mockResolvedValueOnce(detail)
    const wrapper = await mountDetail()
    await flushPromises()

    expect(wrapper.get('[data-testid="order-detail-error"]').text()).toContain('订单不存在')
    await wrapper.get('[data-testid="retry-order-detail"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('华为 Mate 60 Pro')
    expect(orderApi.getMerchantOrderDetail).toHaveBeenCalledTimes(2)
  })
})
