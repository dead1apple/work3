import { MerchantAccessError } from '../store/session'

function loginDestination(fullPath) {
  if (typeof fullPath === 'string' && fullPath.startsWith('/') && !fullPath.startsWith('//')) {
    return { name: 'login', query: { redirect: fullPath } }
  }

  return { name: 'login' }
}

export function createMerchantGuard(session, shop) {
  return async function merchantGuard(to) {
    if (to.name === 'login') {
      try {
        await session.restore()
        if (session.isMerchant) {
          await shop.restore().catch(() => null)
          return { name: 'merchant-home' }
        }
      } catch (error) {
        shop.reset()
        if (error instanceof MerchantAccessError) {
          return { name: 'forbidden' }
        }

        return true
      }

      shop.reset()
      return true
    }

    if (!to.meta.requiresMerchant) {
      return true
    }

    try {
      await session.restore()
    } catch (error) {
      shop.reset()
      if (error instanceof MerchantAccessError) {
        return { name: 'forbidden' }
      }

      return loginDestination(to.fullPath)
    }

    if (!session.isMerchant) {
      shop.reset()
      return loginDestination(to.fullPath)
    }

    await shop.restore().catch(() => null)
    return true
  }
}
