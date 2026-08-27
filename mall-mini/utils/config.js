export const API_ORIGIN = 'http://49.235.130.42:8080'
export const API_BASE_URL = `${API_ORIGIN}/api`

export function resolveAssetUrl(value) {
	const url = String(value || '').trim()
	if (!url) return ''
	if (/^(https?:|data:|blob:)/i.test(url)) return url
	return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}
