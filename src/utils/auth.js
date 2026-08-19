export const AUTH_TOKEN_KEYS = ['token', 'access_token']
export const CART_STORAGE_KEY = 'cart'

export const getAuthToken = (payload) => {
  const data = payload?.data || payload
  return data?.token || data?.accessToken || ''
}

export const resolveRedirect = (redirect) => {
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) return redirect
  return '/home'
}

export const readAuthToken = (storage = localStorage) =>
  AUTH_TOKEN_KEYS.map((key) => storage.getItem(key)).find(Boolean) || ''

export const clearAuthStorage = (storage = localStorage, { clearCart = false } = {}) => {
  AUTH_TOKEN_KEYS.forEach((key) => storage.removeItem(key))
  if (clearCart) storage.removeItem(CART_STORAGE_KEY)
}

export const writeAuthToken = (token, storage = localStorage) => {
  clearAuthStorage(storage)
  if (token) storage.setItem(AUTH_TOKEN_KEYS[0], token)
}

export const isCurrentRequestToken = (requestToken, storage = localStorage) =>
  Boolean(requestToken) && requestToken === readAuthToken(storage)
