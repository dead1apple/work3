import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '../api/auth'
import { ApiProtocolError } from '../utils/api-errors'
import { clearToken, getToken, setToken } from '../utils/token'

export class MerchantAccessError extends Error {
  constructor(message = '当前账号没有商家后台权限') {
    super(message)
    this.name = 'MerchantAccessError'
    this.code = 'MERCHANT_ACCESS_DENIED'
  }
}

export const useSessionStore = defineStore('merchant-session', () => {
  const user = ref(null)
  const status = ref('idle')
  let restorePromise = null

  const isMerchant = computed(
    () => status.value === 'authenticated' && user.value?.role === 1,
  )
  const displayName = computed(
    () => user.value?.nickname || user.value?.username || '商家用户',
  )

  function invalidate() {
    clearToken()
    user.value = null
    status.value = 'anonymous'
  }

  function trustMerchant(candidate) {
    if (!candidate || candidate.role !== 1) {
      throw new MerchantAccessError()
    }

    user.value = candidate
    status.value = 'authenticated'
    return candidate
  }

  async function signIn(credentials) {
    invalidate()
    status.value = 'restoring'

    try {
      const loginResult = await authApi.login(credentials)
      const token = loginResult?.token

      if (typeof token !== 'string' || token.length === 0) {
        throw new ApiProtocolError('登录响应中缺少有效 token')
      }

      setToken(token)
      const currentUser = await authApi.getCurrentUser()
      return trustMerchant(currentUser)
    } catch (error) {
      invalidate()
      throw error
    }
  }

  function restore() {
    if (isMerchant.value) {
      return Promise.resolve(user.value)
    }

    if (restorePromise) {
      return restorePromise
    }

    if (!getToken()) {
      invalidate()
      return Promise.resolve(null)
    }

    status.value = 'restoring'
    restorePromise = authApi
      .getCurrentUser()
      .then(trustMerchant)
      .catch((error) => {
        invalidate()
        throw error
      })
      .finally(() => {
        restorePromise = null
      })

    return restorePromise
  }

  async function signOut() {
    try {
      if (getToken()) {
        await authApi.logout()
      }
    } finally {
      invalidate()
    }
  }

  return {
    user,
    status,
    isMerchant,
    displayName,
    signIn,
    restore,
    signOut,
    invalidate,
  }
})
