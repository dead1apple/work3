import { API_BASE_URL } from './config.js'
import { clearSession, getToken } from './auth.js'

let redirectingToLogin = false

function appendQuery(url, query = {}) {
	const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '')
	if (!entries.length) return url
	const search = entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
	return `${url}${url.includes('?') ? '&' : '?'}${search}`
}

function redirectToLogin() {
	if (redirectingToLogin) return
	redirectingToLogin = true
	clearSession()
	uni.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
	setTimeout(() => {
		uni.reLaunch({ url: '/pages/auth/login' })
		redirectingToLogin = false
	}, 500)
}

export function request({ url, method = 'GET', data, query, auth = true, header = {} }) {
	const token = getToken()
	const headers = { 'Content-Type': 'application/json', ...header }
	if (auth && token) headers.Authorization = token

	return new Promise((resolve, reject) => {
		uni.request({
			url: appendQuery(`${API_BASE_URL}${url}`, query),
			method,
			data,
			header: headers,
			timeout: 15000,
			success(response) {
				const result = response.data
				if (response.statusCode === 401 || Number(result?.code) === 401) {
					redirectToLogin()
					reject(new Error(result?.msg || '登录已失效'))
					return
				}
				if (response.statusCode < 200 || response.statusCode >= 300) {
					reject(new Error(result?.msg || `请求失败（${response.statusCode}）`))
					return
				}
				if (result && Object.prototype.hasOwnProperty.call(result, 'code')) {
					if (Number(result.code) !== 1) {
						reject(new Error(result.msg || '请求失败'))
						return
					}
					resolve(result.data)
					return
				}
				resolve(result)
			},
			fail(error) {
				reject(new Error(error.errMsg?.includes('timeout') ? '请求超时，请稍后重试' : '网络连接失败，请检查网络'))
			},
		})
	})
}

export default request
