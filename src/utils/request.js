import axios from 'axios'
import { clearAuthStorage } from './auth.js'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token')

const redirectToLogin = () => {
  clearAuthStorage()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    const redirect = `${window.location.pathname}${window.location.search}`
    window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`
  }
}

request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (response) => {
    const result = response.data
    if (result && typeof result.code !== 'undefined') {
      if (result.code === 401) redirectToLogin()
      if (result.code !== 1) {
        const error = new Error(result.msg || '请求失败')
        error.code = result.code
        error.response = response
        return Promise.reject(error)
      }
      return typeof result.data === 'undefined' ? result : result.data
    }
    return result
  },
  (error) => {
    if (error.response?.status === 401) redirectToLogin()
    return Promise.reject(error)
  },
)

export default request
