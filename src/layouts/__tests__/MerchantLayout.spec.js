import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, it } from 'vitest'
import { useSessionStore } from '../../store/session'
import { useShopStore } from '../../store/shop'
import MerchantLayout from '../MerchantLayout.vue'

const EmptyView = { template: '<div class="route-content">页面内容</div>' }

async function mountLayout() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useSessionStore(pinia)
  const shopStore = useShopStore(pinia)
  store.user = { id: 2, username: 'merchant', nickname: '经营者小李', role: 1 }
  store.status = 'authenticated'
  shopStore.shop = { id: 1, userId: 2, shopName: '华为官方旗舰店', status: 1 }
  shopStore.status = 'ready'

  const router = createRouter({
    history: createMemoryHistory('/merchant/'),
    routes: [
      {
        path: '/',
        component: MerchantLayout,
        children: [
          { path: '', name: 'merchant-home', component: EmptyView },
          { path: 'products', name: 'merchant-products', component: EmptyView },
          { path: 'orders', name: 'merchant-orders', component: EmptyView },
        ],
      },
      { path: '/login', name: 'login', component: EmptyView },
    ],
  })
  await router.push('/')
  await router.isReady()

  const wrapper = mount(MerchantLayout, {
    global: {
      plugins: [pinia, router, ElementPlus],
    },
  })

  return { wrapper, router, store, shopStore }
}

describe('MerchantLayout', () => {
  it('shows only implemented navigation and separates merchant from shop', async () => {
    const { wrapper } = await mountLayout()
    const navigation = wrapper.get('nav[aria-label="商家后台导航"]')

    expect(navigation.findAll('a').map((link) => link.text())).toEqual(['首页', '商品列表', '订单管理'])
    expect(navigation.get('a[href="/merchant/products"]').exists()).toBe(true)
    expect(navigation.text()).not.toContain('新增商品')
    expect(navigation.text()).not.toContain('库存管理')
    expect(navigation.text()).not.toContain('优惠券')
    expect(wrapper.get('[data-testid="merchant-identity"]').text()).toContain('经营者小李')
    expect(wrapper.get('[data-testid="shop-entry"]').text()).toContain('华为官方旗舰店')
    expect(wrapper.get('a[href="/"]').attributes('target')).toBe('_self')
    expect(wrapper.get('[data-testid="shop-entry"]').attributes()).toHaveProperty('disabled')
  })

  it('clears the session and returns to login', async () => {
    const { wrapper, router, store, shopStore } = await mountLayout()

    await wrapper.get('[data-testid="logout-button"]').trigger('click')
    await flushPromises()

    expect(store.status).toBe('anonymous')
    expect(store.user).toBeNull()
    expect(shopStore.status).toBe('idle')
    expect(shopStore.shop).toBeNull()
    expect(router.currentRoute.value.name).toBe('login')
  })
})
