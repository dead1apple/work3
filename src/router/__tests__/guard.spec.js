import { describe, expect, it, vi } from 'vitest'
import { MerchantAccessError } from '../../store/session'
import { createMerchantGuard } from '../guard'

function createSession(overrides = {}) {
  return {
    isMerchant: false,
    restore: vi.fn().mockResolvedValue(null),
    ...overrides,
  }
}

function createShop(overrides = {}) {
  return {
    restore: vi.fn().mockResolvedValue(null),
    reset: vi.fn(),
    ...overrides,
  }
}

describe('merchant route guard', () => {
  it('sends an anonymous protected visit to login with a local redirect', async () => {
    const session = createSession()
    const shop = createShop()
    const guard = createMerchantGuard(session, shop)

    const result = await guard({
      name: 'merchant-home',
      fullPath: '/',
      meta: { requiresMerchant: true },
    })

    expect(result).toEqual({ name: 'login', query: { redirect: '/' } })
    expect(shop.reset).toHaveBeenCalledOnce()
    expect(shop.restore).not.toHaveBeenCalled()
  })

  it('allows a merchant after trusted session restoration', async () => {
    const session = createSession({
      restore: vi.fn().mockImplementation(async function restore() {
        session.isMerchant = true
      }),
    })
    const shop = createShop()
    const guard = createMerchantGuard(session, shop)

    await expect(
      guard({ name: 'merchant-home', fullPath: '/', meta: { requiresMerchant: true } }),
    ).resolves.toBe(true)
    expect(shop.restore).toHaveBeenCalledOnce()
    expect(session.restore.mock.invocationCallOrder[0]).toBeLessThan(
      shop.restore.mock.invocationCallOrder[0],
    )
  })

  it('sends a trusted non-merchant to forbidden', async () => {
    const session = createSession({
      restore: vi.fn().mockRejectedValue(new MerchantAccessError()),
    })
    const shop = createShop()
    const guard = createMerchantGuard(session, shop)

    await expect(
      guard({ name: 'merchant-home', fullPath: '/', meta: { requiresMerchant: true } }),
    ).resolves.toEqual({ name: 'forbidden' })
    expect(shop.reset).toHaveBeenCalledOnce()
    expect(shop.restore).not.toHaveBeenCalled()
  })

  it('sends an authenticated merchant away from login', async () => {
    const session = createSession({ isMerchant: true })
    const shop = createShop()
    const guard = createMerchantGuard(session, shop)

    await expect(
      guard({ name: 'login', fullPath: '/login', meta: {} }),
    ).resolves.toEqual({ name: 'merchant-home' })
    expect(shop.restore).toHaveBeenCalledOnce()
  })

  it('does not propagate a network-path reference as a login redirect', async () => {
    const session = createSession()
    const guard = createMerchantGuard(session, createShop())

    await expect(
      guard({
        name: 'merchant-home',
        fullPath: '//evil.example/path',
        meta: { requiresMerchant: true },
      }),
    ).resolves.toEqual({ name: 'login' })
  })

  it('treats a failed restoration other than access denial as anonymous', async () => {
    const session = createSession({
      restore: vi.fn().mockRejectedValue(new Error('network unavailable')),
    })
    const shop = createShop()
    const guard = createMerchantGuard(session, shop)

    await expect(
      guard({ name: 'merchant-home', fullPath: '/', meta: { requiresMerchant: true } }),
    ).resolves.toEqual({ name: 'login', query: { redirect: '/' } })
    expect(shop.reset).toHaveBeenCalledOnce()
  })

  it('keeps a trusted merchant route available when shop restoration fails', async () => {
    const session = createSession({
      restore: vi.fn().mockImplementation(async function restore() {
        session.isMerchant = true
      }),
    })
    const shop = createShop({
      restore: vi.fn().mockRejectedValue(new Error('shop unavailable')),
    })
    const guard = createMerchantGuard(session, shop)

    await expect(
      guard({ name: 'merchant-home', fullPath: '/', meta: { requiresMerchant: true } }),
    ).resolves.toBe(true)

    expect(session.isMerchant).toBe(true)
    expect(shop.reset).not.toHaveBeenCalled()
  })
})
