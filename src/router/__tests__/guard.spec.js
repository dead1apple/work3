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

describe('merchant route guard', () => {
  it('sends an anonymous protected visit to login with a local redirect', async () => {
    const session = createSession()
    const guard = createMerchantGuard(session)

    const result = await guard({
      name: 'merchant-home',
      fullPath: '/',
      meta: { requiresMerchant: true },
    })

    expect(result).toEqual({ name: 'login', query: { redirect: '/' } })
  })

  it('allows a merchant after trusted session restoration', async () => {
    const session = createSession({
      restore: vi.fn().mockImplementation(async function restore() {
        session.isMerchant = true
      }),
    })
    const guard = createMerchantGuard(session)

    await expect(
      guard({ name: 'merchant-home', fullPath: '/', meta: { requiresMerchant: true } }),
    ).resolves.toBe(true)
  })

  it('sends a trusted non-merchant to forbidden', async () => {
    const session = createSession({
      restore: vi.fn().mockRejectedValue(new MerchantAccessError()),
    })
    const guard = createMerchantGuard(session)

    await expect(
      guard({ name: 'merchant-home', fullPath: '/', meta: { requiresMerchant: true } }),
    ).resolves.toEqual({ name: 'forbidden' })
  })

  it('sends an authenticated merchant away from login', async () => {
    const session = createSession({ isMerchant: true })
    const guard = createMerchantGuard(session)

    await expect(
      guard({ name: 'login', fullPath: '/login', meta: {} }),
    ).resolves.toEqual({ name: 'merchant-home' })
  })

  it('does not propagate a network-path reference as a login redirect', async () => {
    const session = createSession()
    const guard = createMerchantGuard(session)

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
    const guard = createMerchantGuard(session)

    await expect(
      guard({ name: 'merchant-home', fullPath: '/', meta: { requiresMerchant: true } }),
    ).resolves.toEqual({ name: 'login', query: { redirect: '/' } })
  })
})
