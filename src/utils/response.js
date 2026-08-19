export const unwrapData = (payload) => payload?.data ?? payload

export function readPayloadList(payload, keys = ['list', 'records', 'items', 'rows']) {
  const source = unwrapData(payload)
  if (Array.isArray(source)) return source
  return keys.map((key) => source?.[key]).find(Array.isArray) || []
}

export function toFiniteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function toNonNegativeMoney(value, fallback = 0) {
  const number = toFiniteNumber(value, fallback)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

export function toBoundedPositiveInteger(value, { fallback = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? Math.min(number, max) : fallback
}
