import axios from 'axios'
import { clearAuthStorage, isCurrentRequestToken, readAuthToken, toAuthorizationValue } from './auth.js'
import { notifySessionInvalidated } from './sessionInvalidation.js'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

let hasRedirectedToLogin = false
let lastAuthenticatedToken = ''

const redirectToLogin = (requestToken) => {
  if (!isCurrentRequestToken(requestToken)) return

  clearAuthStorage(undefined, { clearCart: true })
  notifySessionInvalidated()
  lastAuthenticatedToken = ''
  if (!hasRedirectedToLogin && typeof window !== 'undefined' && window.location.pathname !== '/login') {
    hasRedirectedToLogin = true
    const redirect = `${window.location.pathname}${window.location.search}`
    window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`
  }
}

request.interceptors.request.use((config) => {
  const token = readAuthToken()
  if (token && token !== lastAuthenticatedToken) hasRedirectedToLogin = false
  lastAuthenticatedToken = token
  config.__authToken = token
  const authorization = toAuthorizationValue(token)
  if (authorization) config.headers.Authorization = authorization
  return config
})

request.interceptors.response.use(
  (response) => {
    const result = response.data
    if (result && typeof result.code !== 'undefined') {
      const code = Number(result.code)
      if (code === 401) redirectToLogin(response.config?.__authToken)
      if (code !== 1) {
        const error = new Error(result.msg || '请求失败')
        error.code = code
        error.response = response
        return Promise.reject(error)
      }
      return typeof result.data === 'undefined' ? result : result.data
    }
    return result
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) redirectToLogin(error.response.config?.__authToken)
    if (status === 403) error.code = 403
    return Promise.reject(error)
  },
)

export default request
