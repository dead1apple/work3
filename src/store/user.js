import { defineStore } from 'pinia'
import { clearAuthStorage } from '../utils/auth.js'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
  },
  actions: {
    setToken(token) {
      this.token = token || ''
      if (this.token) localStorage.setItem('token', this.token)
      else localStorage.removeItem('token')
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
      clearAuthStorage()
    },
  },
})
