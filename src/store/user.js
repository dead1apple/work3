import { defineStore } from 'pinia'
import { clearAuthStorage, readAuthToken, writeAuthToken } from '../utils/auth.js'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: readAuthToken(),
    userInfo: null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
  },
  actions: {
    setToken(token) {
      this.token = token || ''
      writeAuthToken(this.token)
    },
    setUserInfo(userInfo) {
      this.userInfo = userInfo || null
    },
    setSession(token, userInfo = null) {
      this.setToken(token)
      this.setUserInfo(userInfo)
    },
    clearSession() {
      this.token = ''
      this.userInfo = null
      clearAuthStorage(undefined, { clearCart: true })
    },
  },
})
