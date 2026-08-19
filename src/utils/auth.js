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

export const normalizeMainlandMobile = (phone) => {
  const value = String(phone ?? '').trim()
  if (!/^1[3-9]\d{9}$/.test(value)) throw new Error('请输入有效的 11 位手机号')
  return value
}

export const createRegistrationCodeSender = ({
  sendCode,
  seconds = 60,
  setInterval: startInterval = globalThis.setInterval,
  clearInterval: stopInterval = globalThis.clearInterval,
  onStateChange = () => {},
} = {}) => {
  let sending = false
  let countdown = 0
  let timerId = null

  const snapshot = () => ({
    sending,
    countdown,
    disabled: sending || countdown > 0,
  })

  const emit = () => onStateChange(snapshot())

  const clearTimer = () => {
    if (timerId == null) return
    stopInterval(timerId)
    timerId = null
  }

  const startCountdown = () => {
    clearTimer()
    countdown = seconds
    emit()
    timerId = startInterval(() => {
      countdown = Math.max(0, countdown - 1)
      if (countdown === 0) clearTimer()
      emit()
    }, 1000)
  }

  emit()

  return {
    get sending() { return sending },
    get countdown() { return countdown },
    get disabled() { return sending || countdown > 0 },
    send(phone) {
      if (sending || countdown > 0) return false
      const normalizedPhone = normalizeMainlandMobile(phone)
      sending = true
      emit()
      return Promise.resolve(sendCode({ phone: normalizedPhone }))
        .then(() => {
          startCountdown()
          return true
        })
        .finally(() => {
          sending = false
          emit()
        })
    },
    cleanup() {
      clearTimer()
      countdown = 0
      sending = false
      emit()
    },
  }
}
