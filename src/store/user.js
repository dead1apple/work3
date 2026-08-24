import { defineStore } from 'pinia'
import { login as authenticateUser } from '../api/auth.js'
import { getUserInfo } from '../api/user.js'
import { clearAuthStorage, getAuthToken, readAuthToken, writeAuthToken } from '../utils/auth.js'
import { setSessionInvalidationHandler } from '../utils/sessionInvalidation.js'

const VALID_ROLES = [0, 1, 2]
const restorePromises = new WeakMap()

const toSafeUserInfo = (userInfo) => {
  if (!userInfo || typeof userInfo !== 'object' || Array.isArray(userInfo)) return null
  const { password: _password, ...safeUserInfo } = userInfo
  return safeUserInfo
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: readAuthToken(),
    userInfo: null,
    sessionInitialized: false,
    sessionRestoring: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    role: (state) => VALID_ROLES.includes(state.userInfo?.role) ? state.userInfo.role : null,
    isUser() {
      return this.role === 0
    },
    isMerchant() {
      return this.role === 1
    },
    isAdmin() {
      return this.role === 2
    },
  },
  actions: {
    setToken(token) {
      const nextToken = token || ''
      if (nextToken !== this.token) {
        this.userInfo = null
        this.sessionInitialized = !nextToken
      }
      this.token = nextToken
      writeAuthToken(this.token)
    },
    setUserInfo(userInfo) {
      this.userInfo = toSafeUserInfo(userInfo)
    },
    setSession(token, userInfo = null) {
      this.setToken(token)
      this.setUserInfo(userInfo)
      this.sessionInitialized = Boolean(this.userInfo) || !this.token
    },
    async restoreSession({ fetchUserInfo = getUserInfo, force = false } = {}) {
      if (!this.token) {
        this.userInfo = null
        this.sessionInitialized = true
        this.sessionRestoring = false
        return null
      }

      const activeRestore = restorePromises.get(this)
      if (activeRestore) return activeRestore
      if (!force && this.sessionInitialized && this.userInfo) return this.userInfo

      const restoringToken = this.token
      this.sessionRestoring = true
      const restorePromise = (async () => {
        try {
          const userInfo = await fetchUserInfo()
          if (this.token !== restoringToken) return this.userInfo
          this.setUserInfo(userInfo)
          this.sessionInitialized = true
          return this.userInfo
        } catch (error) {
          if (this.token === restoringToken) this.sessionInitialized = true
          throw error
        } finally {
          if (this.token === restoringToken) this.sessionRestoring = false
          restorePromises.delete(this)
        }
      })()

      restorePromises.set(this, restorePromise)
      return restorePromise
    },
    refreshUserInfo({ fetchUserInfo = getUserInfo } = {}) {
      return this.restoreSession({ fetchUserInfo, force: true })
    },
    async login(credentials, { authenticate = authenticateUser, fetchUserInfo = getUserInfo } = {}) {
      const result = await authenticate(credentials)
      const token = getAuthToken(result)
      if (!token) throw new Error('登录响应中没有 Token')

      this.setToken(token)
      try {
        return await this.restoreSession({ fetchUserInfo, force: true })
      } catch (error) {
        this.clearSession()
        throw error
      }
    },
    connectSessionInvalidation() {
      return setSessionInvalidationHandler(() => this.clearSession())
    },
    clearSession() {
      this.token = ''
      this.userInfo = null
      this.sessionInitialized = true
      this.sessionRestoring = false
      clearAuthStorage(undefined, { clearCart: true })
    },
  },
})
