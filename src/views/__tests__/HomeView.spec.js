import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '../../store/session'
import { useShopStore } from '../../store/shop'
import { getMerchantProducts } from '../../api/product'
import { getMerchantOrders } from '../../api/order'
import HomeView from '../HomeView.vue'

vi.mock('../../api/product', () => ({ getMerchantProducts: vi.fn() }))
vi.mock('../../api/order', () => ({ getMerchantOrders: vi.fn() }))

function mountHome(shopState) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const session = useSessionStore(pinia)
  const shop = useShopStore(pinia)
  session.user = { id: 2, username: 'merchant', nickname: '经营者小李', role: 1 }
  session.status = 'authenticated'
  shop.$patch(shopState)

  return mount(HomeView, {
    global: { plugins: [pinia, ElementPlus] },
  })
}

describe('HomeView shop context', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    getMerchantProducts.mockImplementation(({ status } = {}) => Promise.resolve({
      total: status === 1 ? 4 : status === 0 ? 2 : status === 2 ? 2 : 8,
    }))
    getMerchantOrders.mockImplementation(({ status } = {}) => Promise.resolve({ total: status === 1 ? 3 : 5 }))
  })

  it('shows trusted user identity and current shop as separate concepts', () => {
    const wrapper = mountHome({
      status: 'ready',
      shop: {
        id: 1,
        userId: 2,
        shopName: '华为官方旗舰店',
        status: 1,
        rating: 4.9,
        address: '北京市东城区王府井大街 88 号',
      },
    })

    expect(wrapper.get('[data-testid="identity-summary"]').text()).toContain('经营者小李')
    expect(wrapper.get('[data-testid="identity-summary"]').text()).toContain('merchant')
    expect(wrapper.get('[data-testid="shop-summary"]').text()).toContain('华为官方旗舰店')
    expect(wrapper.get('[data-testid="shop-summary"]').text()).toContain('营业中')
    expect(wrapper.get('[data-testid="shop-summary"]').text()).not.toContain('经营者小李')
  })

  it('shows a precise empty state when the merchant has no shop', () => {
    const wrapper = mountHome({ status: 'empty', shop: null })

    expect(wrapper.get('[data-testid="shop-summary"]').text()).toContain('尚未建立店铺')
    expect(wrapper.text()).not.toContain('创建店铺')
  })

  it('shows a retry-neutral error state without revoking merchant access', () => {
    const wrapper = mountHome({
      status: 'error',
      shop: null,
      error: new Error('shop unavailable'),
    })

    expect(wrapper.get('[data-testid="shop-summary"]').text()).toContain('店铺信息加载失败')
    expect(wrapper.get('[data-testid="identity-summary"]').text()).toContain('经营者小李')
  })
})

describe('HomeView dashboard', () => {
  beforeEach(() => {
    getMerchantProducts.mockImplementation(({ status } = {}) => Promise.resolve({
      total: status === 1 ? 4 : status === 0 ? 2 : status === 2 ? 2 : 8,
    }))
    getMerchantOrders.mockImplementation(({ status } = {}) => Promise.resolve({ total: status === 1 ? 3 : 5 }))
  })

  it('loads exact token-scoped totals for the supported product and order statuses', async () => {
    const wrapper = mountHome({ status: 'ready', shop: { shopName: '华为官方旗舰店', status: 1 } })
    await flushPromises()

    expect(wrapper.text()).toContain('商品总数')
    expect(wrapper.text()).toContain('待发货订单')
    expect(getMerchantProducts).toHaveBeenCalledWith({ page: 1, size: 1 })
    expect(getMerchantProducts).toHaveBeenCalledWith({ status: 1, page: 1, size: 1 })
    expect(getMerchantProducts).toHaveBeenCalledWith({ status: 0, page: 1, size: 1 })
    expect(getMerchantProducts).toHaveBeenCalledWith({ status: 2, page: 1, size: 1 })
    expect(getMerchantOrders).toHaveBeenCalledWith({ page: 1, size: 1 })
    expect(getMerchantOrders).toHaveBeenCalledWith({ status: 1, page: 1, size: 1 })
  })
})
