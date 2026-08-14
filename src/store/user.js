import { defineStore } from 'pinia'

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
      this.setSession('', null)
      localStorage.removeItem('access_token')
    },
  },
})
