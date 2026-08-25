import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setToken, getToken } from '../token'
import { ApiBusinessError, ApiProtocolError } from '../api-errors'
import request, { setUnauthorizedHandler } from '../request'

function response(config, data, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Unauthorized',
    headers: {},
    config,
  }
}

afterEach(() => {
  setUnauthorizedHandler(null)
})

describe('request boundary', () => {
  it('uses the /api base URL and attaches the raw token', async () => {
    setToken('server-token')
    let observedConfig

    const data = await request.get('/user/info', {
      adapter: async (config) => {
        observedConfig = config
        return response(config, { code: 1, msg: 'success', data: { id: 2 } })
      },
    })

    expect(request.defaults.baseURL).toBe('/api')
    expect(observedConfig.headers.get('Authorization')).toBe('server-token')
    expect(data).toEqual({ id: 2 })
  })

  it('does not attach Authorization when there is no token', async () => {
    let observedConfig

    await request.get('/public', {
      adapter: async (config) => {
        observedConfig = config
        return response(config, { code: 1, msg: 'success', data: null })
      },
    })

    expect(observedConfig.headers.has('Authorization')).toBe(false)
  })

  it('throws a business error for every non-success code', async () => {
    const promise = request.get('/failure', {
      adapter: async (config) =>
        response(config, { code: -1, msg: '账号或密码错误', data: null }),
    })

    await expect(promise).rejects.toBeInstanceOf(ApiBusinessError)
    await expect(promise).rejects.toMatchObject({ code: -1, message: '账号或密码错误' })
  })

  it.each([
    null,
    { code: 1, msg: 'success' },
    { code: 1, data: {} },
    { msg: 'success', data: {} },
  ])('rejects an unknown response structure: %j', async (payload) => {
    const promise = request.get('/unknown', {
      adapter: async (config) => response(config, payload),
    })

    await expect(promise).rejects.toBeInstanceOf(ApiProtocolError)
  })

  it('clears the token and notifies the application on HTTP 401', async () => {
    setToken('expired-token')
    const unauthorizedHandler = vi.fn()
    setUnauthorizedHandler(unauthorizedHandler)

    const promise = request.get('/protected', {
      adapter: async (config) => {
        const rejectedResponse = response(
          config,
          { code: -1, msg: '未登录', data: null },
          401,
        )
        throw new axios.AxiosError(
          'Request failed with status code 401',
          'ERR_BAD_REQUEST',
          config,
          null,
          rejectedResponse,
        )
      },
    })

    await expect(promise).rejects.toMatchObject({ response: { status: 401 } })
    expect(getToken()).toBeNull()
    expect(unauthorizedHandler).toHaveBeenCalledOnce()
  })
})
