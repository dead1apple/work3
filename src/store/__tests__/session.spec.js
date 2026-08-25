import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '../../api/auth'
import { ApiProtocolError } from '../../utils/api-errors'
import { getToken, setToken } from '../../utils/token'
import { MerchantAccessError, useSessionStore } from '../session'

vi.mock('../../api/auth', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}))

const merchantUser = {
  id: 2,
  username: 'merchant',
  nickname: '华为旗舰店',
  phone: '13800000001',
  email: 'merchant@mall.com',
  avatar: 'https://picsum.photos/seed/merchant/200/200',
  gender: 1,
  birthday: null,
  status: 1,
  role: 1,
  lastLoginTime: '2026-08-25 16:52:09',
  lastLoginIp: '117.65.24.8',
  createTime: '2026-08-14 13:47:29',
  updateTime: '2026-08-25 16:52:08',
  deleted: 0,
}

describe('merchant session store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(authApi.login).mockReset()
    vi.mocked(authApi.getCurrentUser).mockReset()
    vi.mocked(authApi.logout).mockReset()
  })

  it('trusts current-user instead of the login response when signing in', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'server-token',
      user: { ...merchantUser, role: 0 },
    })
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(merchantUser)
    const store = useSessionStore()

    await store.signIn({ username: 'merchant', password: '123456' })

    expect(store.status).toBe('authenticated')
    expect(store.user).toEqual(merchantUser)
    expect(store.isMerchant).toBe(true)
    expect(store.displayName).toBe('华为旗舰店')
    expect(getToken()).toBe('server-token')
  })

  it.each([0, 2])('rejects trusted role %i and clears the partial session', async (role) => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'server-token', user: merchantUser })
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({ ...merchantUser, role })
    const store = useSessionStore()

    await expect(
      store.signIn({ username: 'merchant', password: '123456' }),
    ).rejects.toBeInstanceOf(MerchantAccessError)
    expect(store.status).toBe('anonymous')
    expect(store.user).toBeNull()
    expect(getToken()).toBeNull()
  })

  it('rejects a login response that does not contain a usable token', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: '', user: merchantUser })
    const store = useSessionStore()

    await expect(
      store.signIn({ username: 'merchant', password: '123456' }),
    ).rejects.toBeInstanceOf(ApiProtocolError)
    expect(authApi.getCurrentUser).not.toHaveBeenCalled()
    expect(store.status).toBe('anonymous')
  })

  it('restores no session when local storage has no token', async () => {
    const store = useSessionStore()

    await expect(store.restore()).resolves.toBeNull()

    expect(authApi.getCurrentUser).not.toHaveBeenCalled()
    expect(store.status).toBe('anonymous')
  })

  it('deduplicates concurrent trusted session restoration', async () => {
    setToken('saved-token')
    let resolveUser
    vi.mocked(authApi.getCurrentUser).mockReturnValue(
      new Promise((resolve) => {
        resolveUser = resolve
      }),
    )
    const store = useSessionStore()

    const first = store.restore()
    const second = store.restore()
    resolveUser(merchantUser)

    await expect(Promise.all([first, second])).resolves.toEqual([merchantUser, merchantUser])
    expect(authApi.getCurrentUser).toHaveBeenCalledOnce()
    expect(store.status).toBe('authenticated')
  })

  it('rejects a non-merchant during restoration', async () => {
    setToken('saved-token')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({ ...merchantUser, role: 2 })
    const store = useSessionStore()

    await expect(store.restore()).rejects.toBeInstanceOf(MerchantAccessError)
    expect(getToken()).toBeNull()
    expect(store.status).toBe('anonymous')
  })

  it('always clears the local session when remote logout fails', async () => {
    setToken('saved-token')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(merchantUser)
    vi.mocked(authApi.logout).mockRejectedValue(new Error('network unavailable'))
    const store = useSessionStore()
    await store.restore()

    await expect(store.signOut()).rejects.toThrow('network unavailable')

    expect(getToken()).toBeNull()
    expect(store.user).toBeNull()
    expect(store.status).toBe('anonymous')
  })
})
