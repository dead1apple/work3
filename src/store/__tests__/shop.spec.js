import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as shopApi from '../../api/shop'
import { useShopStore } from '../shop'

vi.mock('../../api/shop', () => ({
  getCurrentShop: vi.fn(),
}))

const merchantShop = {
  id: 1,
  userId: 2,
  shopName: '华为官方旗舰店',
  logo: null,
  description: '华为官方授权，正品保障，全国联保',
  licenseImage: null,
  status: 1,
  rating: 4.9,
  location: '116.397428,39.90923',
  address: '北京市东城区王府井大街 88 号',
}

describe('merchant shop store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(shopApi.getCurrentShop).mockReset()
  })

  it('restores the current shop into the ready state', async () => {
    vi.mocked(shopApi.getCurrentShop).mockResolvedValue(merchantShop)
    const store = useShopStore()

    await expect(store.restore()).resolves.toEqual(merchantShop)

    expect(store.status).toBe('ready')
    expect(store.shop).toEqual(merchantShop)
    expect(store.error).toBeNull()
    expect(store.isReady).toBe(true)
    expect(store.hasNoShop).toBe(false)
  })

  it('represents a trusted null response as an empty shop context', async () => {
    vi.mocked(shopApi.getCurrentShop).mockResolvedValue(null)
    const store = useShopStore()

    await expect(store.restore()).resolves.toBeNull()

    expect(store.status).toBe('empty')
    expect(store.shop).toBeNull()
    expect(store.hasNoShop).toBe(true)
  })

  it('keeps shop loading failures separate from merchant identity', async () => {
    const failure = new Error('shop unavailable')
    vi.mocked(shopApi.getCurrentShop).mockRejectedValue(failure)
    const store = useShopStore()

    await expect(store.restore()).rejects.toBe(failure)

    expect(store.status).toBe('error')
    expect(store.shop).toBeNull()
    expect(store.error).toBe(failure)
  })

  it('deduplicates concurrent restoration and caches resolved contexts', async () => {
    let resolveShop
    vi.mocked(shopApi.getCurrentShop).mockReturnValue(
      new Promise((resolve) => {
        resolveShop = resolve
      }),
    )
    const store = useShopStore()

    const first = store.restore()
    const second = store.restore()
    resolveShop(merchantShop)

    await expect(Promise.all([first, second])).resolves.toEqual([
      merchantShop,
      merchantShop,
    ])
    await expect(store.restore()).resolves.toEqual(merchantShop)
    expect(shopApi.getCurrentShop).toHaveBeenCalledOnce()
  })

  it('caches an empty context without repeatedly requesting it', async () => {
    vi.mocked(shopApi.getCurrentShop).mockResolvedValue(null)
    const store = useShopStore()

    await store.restore()
    await store.restore()

    expect(shopApi.getCurrentShop).toHaveBeenCalledOnce()
  })

  it('resets all shop context state', async () => {
    vi.mocked(shopApi.getCurrentShop).mockResolvedValue(merchantShop)
    const store = useShopStore()
    await store.restore()

    store.reset()

    expect(store.status).toBe('idle')
    expect(store.shop).toBeNull()
    expect(store.error).toBeNull()
  })

  it('does not restore stale shop data after reset during an in-flight request', async () => {
    let resolveShop
    vi.mocked(shopApi.getCurrentShop).mockReturnValue(
      new Promise((resolve) => {
        resolveShop = resolve
      }),
    )
    const store = useShopStore()

    const restoration = store.restore()
    store.reset()
    resolveShop(merchantShop)
    await restoration

    expect(store.status).toBe('idle')
    expect(store.shop).toBeNull()
  })
})
