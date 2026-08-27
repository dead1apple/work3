import { resolveAssetUrl } from './config.js'

export function formatMoney(value) {
	const amount = Number(value)
	return (Number.isFinite(amount) && amount >= 0 ? amount : 0).toFixed(2)
}

export function formatDate(value) {
	if (!value) return ''
	return String(value).replace('T', ' ').slice(0, 16)
}

export function parseImages(...sources) {
	const values = sources.flatMap((source) => {
		if (Array.isArray(source)) return source
		if (typeof source !== 'string') return []
		const text = source.trim()
		if (!text) return []
		if (text.startsWith('[')) {
			try {
				const parsed = JSON.parse(text)
				return Array.isArray(parsed) ? parsed : [text]
			} catch {
				return text.split(',')
			}
		}
		return text.startsWith('data:') ? [text] : text.split(',')
	})
	return [...new Set(values.map(resolveAssetUrl).filter(Boolean))]
}

export function readList(payload) {
	if (Array.isArray(payload)) return payload
	if (!payload || typeof payload !== 'object') return []
	return ['list', 'records', 'items', 'rows'].map((key) => payload[key]).find(Array.isArray) || []
}

export function clampQuantity(value) {
	const quantity = Number(value)
	return Number.isInteger(quantity) ? Math.min(99, Math.max(1, quantity)) : 1
}
