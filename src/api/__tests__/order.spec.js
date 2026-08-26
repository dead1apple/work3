import { afterEach, describe, expect, it } from 'vitest'
import { setToken } from '../../utils/token'
import request from '../../utils/request'
import { getMerchantOrders } from '../order'

const originalAdapter = request.defaults.adapter

function response(config, data) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }
}

afterEach(() => {
  request.defaults.adapter = originalAdapter
})

describe('merchant order API', () => {
  it('requests the token-scoped order page with only documented filters', async () => {
    setToken('merchant-token')
    let observedConfig
    const orderPage = { total: 1, list: [], page: 2, size: 20 }
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: orderPage })
    }

    const result = await getMerchantOrders({ status: 1, page: 2, size: 20 })

    expect(observedConfig.url).toBe('/merchant/orders')
    expect(observedConfig.params).toEqual({ status: 1, page: 2, size: 20 })
    expect(observedConfig.params).not.toHaveProperty('shopId')
    expect(observedConfig.headers.get('Authorization')).toBe('merchant-token')
    expect(result).toEqual(orderPage)
  })
})
