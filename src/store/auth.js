import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null,
  }),
  getters: { isLoggedIn: (state) => Boolean(state.token) },
  actions: {
    setSession(token, user = null) {
      this.token = token || ''
      this.user = user
      if (this.token) localStorage.setItem('token', this.token)
    },
    clearSession() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    },
  },
})
