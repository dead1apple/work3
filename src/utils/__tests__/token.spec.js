import { beforeEach, describe, expect, it } from 'vitest'
import { AUTH_TOKEN_KEY } from '../../config/auth'
import { clearToken, getToken, setToken } from '../token'

describe('merchant token storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('stores the token under the centralized merchant key', () => {
    setToken('server-token')

    expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBe('server-token')
    expect(getToken()).toBe('server-token')
  })

  it('removes the current merchant token', () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'expired-token')

    clearToken()

    expect(getToken()).toBeNull()
  })
})

