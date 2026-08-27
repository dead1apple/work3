const TOKEN_KEY = 'mall_mini_token'
const USER_KEY = 'mall_mini_user'

export function getToken() {
	return uni.getStorageSync(TOKEN_KEY) || ''
}

export function saveSession(token, user) {
	const normalizedToken = String(token || '').replace(/^Bearer\s+/i, '').trim()
	if (normalizedToken) uni.setStorageSync(TOKEN_KEY, normalizedToken)
	if (user) uni.setStorageSync(USER_KEY, user)
}

export function getStoredUser() {
	return uni.getStorageSync(USER_KEY) || null
}

export function saveStoredUser(user) {
	if (user) uni.setStorageSync(USER_KEY, user)
}

export function clearSession() {
	uni.removeStorageSync(TOKEN_KEY)
	uni.removeStorageSync(USER_KEY)
}

export function isLoggedIn() {
	return Boolean(getToken())
}

export function requireLogin(redirect) {
	if (isLoggedIn()) return true
	const target = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
	uni.navigateTo({ url: `/pages/auth/login${target}` })
	return false
}
