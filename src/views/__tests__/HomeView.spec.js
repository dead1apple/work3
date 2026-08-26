import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionStore } from '../../store/session'
import { useShopStore } from '../../store/shop'
import HomeView from '../HomeView.vue'

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
