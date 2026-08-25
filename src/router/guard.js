import { MerchantAccessError } from '../store/session'

function loginDestination(fullPath) {
  if (typeof fullPath === 'string' && fullPath.startsWith('/') && !fullPath.startsWith('//')) {
    return { name: 'login', query: { redirect: fullPath } }
  }

  return { name: 'login' }
}

export function createMerchantGuard(session) {
  return async function merchantGuard(to) {
    if (to.name === 'login') {
      try {
        await session.restore()
      } catch (error) {
        if (error instanceof MerchantAccessError) {
          return { name: 'forbidden' }
        }

        return true
      }

      return session.isMerchant ? { name: 'merchant-home' } : true
    }

    if (!to.meta.requiresMerchant) {
      return true
    }

    try {
      await session.restore()
    } catch (error) {
      if (error instanceof MerchantAccessError) {
        return { name: 'forbidden' }
      }

      return loginDestination(to.fullPath)
    }

    return session.isMerchant ? true : loginDestination(to.fullPath)
  }
}

