import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiBusinessError } from '../../utils/api-errors'
import { MerchantAccessError, useSessionStore } from '../../store/session'
import LoginView from '../LoginView.vue'

const EmptyView = { template: '<div />' }

async function mountLogin(initialPath = '/login') {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory('/merchant/'),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/', name: 'merchant-home', component: EmptyView },
      { path: '/403', name: 'forbidden', component: EmptyView },
    ],
  })
  await router.push(initialPath)
  await router.isReady()

  const wrapper = mount(LoginView, {
    global: {
      plugins: [pinia, router, ElementPlus],
    },
  })

  return { wrapper, router, store: useSessionStore(pinia) }
}

async function submitCredentials(wrapper) {
  await wrapper.get('input[autocomplete="username"]').setValue('merchant')
  await wrapper.get('input[autocomplete="current-password"]').setValue('123456')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('LoginView', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('submits credentials and follows a safe local redirect', async () => {
    const { wrapper, router, store } = await mountLogin('/login?redirect=/')
    store.signIn = vi.fn().mockResolvedValue({ role: 1 })

    await submitCredentials(wrapper)

    expect(store.signIn).toHaveBeenCalledWith({
      username: 'merchant',
      password: '123456',
    })
    expect(router.currentRoute.value.name).toBe('merchant-home')
  })

  it('does not navigate to an external redirect value', async () => {
    const { wrapper, router, store } = await mountLogin(
      '/login?redirect=https://evil.example',
    )
    store.signIn = vi.fn().mockResolvedValue({ role: 1 })

    await submitCredentials(wrapper)

    expect(router.currentRoute.value.name).toBe('merchant-home')
  })

  it('navigates a trusted non-merchant to the permission page', async () => {
    const { wrapper, router, store } = await mountLogin()
    store.signIn = vi.fn().mockRejectedValue(new MerchantAccessError())

    await submitCredentials(wrapper)

    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('shows the backend message and keeps the user on login after failure', async () => {
    const { wrapper, router, store } = await mountLogin()
    store.signIn = vi
      .fn()
      .mockRejectedValue(new ApiBusinessError(-1, '账号或密码错误'))

    await submitCredentials(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toContain('账号或密码错误')
    expect(router.currentRoute.value.name).toBe('login')
  })
})

