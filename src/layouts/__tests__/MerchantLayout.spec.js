import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, it } from 'vitest'
import { useSessionStore } from '../../store/session'
import MerchantLayout from '../MerchantLayout.vue'

const EmptyView = { template: '<div class="route-content">首页内容</div>' }

async function mountLayout() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useSessionStore(pinia)
  store.user = { id: 2, username: 'merchant', nickname: '华为旗舰店', role: 1 }
  store.status = 'authenticated'

  const router = createRouter({
    history: createMemoryHistory('/merchant/'),
    routes: [
      {
        path: '/',
        component: MerchantLayout,
        children: [{ path: '', name: 'merchant-home', component: EmptyView }],
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

  return { wrapper, router, store }
}

describe('MerchantLayout', () => {
  it('shows only the first-phase home navigation and current merchant', async () => {
    const { wrapper } = await mountLayout()
    const navigation = wrapper.get('nav[aria-label="商家后台导航"]')

    expect(navigation.text()).toContain('首页')
    expect(navigation.text()).not.toContain('商品管理')
    expect(navigation.text()).not.toContain('订单管理')
    expect(navigation.text()).not.toContain('优惠券')
    expect(wrapper.text()).toContain('华为旗舰店')
    expect(wrapper.get('a[href="/"]').attributes('target')).toBe('_self')
    expect(wrapper.get('[data-testid="shop-entry"]').attributes()).toHaveProperty('disabled')
  })

  it('clears the session and returns to login', async () => {
    const { wrapper, router, store } = await mountLayout()

    await wrapper.get('[data-testid="logout-button"]').trigger('click')
    await flushPromises()

    expect(store.status).toBe('anonymous')
    expect(store.user).toBeNull()
    expect(router.currentRoute.value.name).toBe('login')
  })
})
