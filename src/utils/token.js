import { AUTH_TOKEN_KEY } from '../config/auth'

export function getToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setToken(token) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

