import type { ApiEnvelope } from './types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
export const TOKEN_KEY = 'mall-admin-token'

type QueryValue = string | number | boolean | null | undefined

export function buildQuery<T extends object>(params: T = {} as T) {
  const query = new URLSearchParams()
  Object.entries(params as Record<string, QueryValue>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

function notifyUnauthorized() {
  setToken(null)
  window.dispatchEvent(new Event('mall-admin:unauthorized'))
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: token } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new Error('无法连接后端服务，请检查网络后重试')
  }

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized()
    }
    throw new Error(`请求失败（${response.status}）`)
  }

  const result = await response.json() as ApiEnvelope<T>
  if (result.code !== 1) {
    if (result.msg?.includes('请先登录管理员账号')) {
      notifyUnauthorized()
    }
    throw new Error(result.msg || '请求处理失败')
  }
  return result.data
}
