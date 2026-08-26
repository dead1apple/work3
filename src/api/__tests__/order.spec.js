import { afterEach, describe, expect, it } from 'vitest'
import { setToken } from '../../utils/token'
import request from '../../utils/request'
import { deliverMerchantOrder, getMerchantOrderDetail, getMerchantOrders } from '../order'

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

  it('posts the documented delivery DTO without shop identity', async () => {
    setToken('merchant-token')
    let observedConfig
    const payload = {
      orderNo: '202606300001',
      logisticsNo: 'SF1234567890',
      logisticsCompany: '顺丰快递',
    }
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: {} })
    }

    await deliverMerchantOrder(payload)

    expect(observedConfig.method).toBe('post')
    expect(observedConfig.url).toBe('/merchant/orders/deliver')
    expect(JSON.parse(observedConfig.data)).toEqual(payload)
    expect(observedConfig.data).not.toContain('shopId')
    expect(observedConfig.headers.get('Authorization')).toBe('merchant-token')
  })

  it('gets one merchant-owned order detail by business order number without shopId', async () => {
    setToken('merchant-token')
    let observedConfig
    const detail = { order: { orderNo: '202606300001' }, items: [], payment: null }
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: detail })
    }

    await expect(getMerchantOrderDetail('202606300001')).resolves.toEqual(detail)

    expect(observedConfig.method).toBe('get')
    expect(observedConfig.url).toBe('/merchant/orders/202606300001')
    expect(observedConfig.params).toBeUndefined()
    expect(observedConfig.headers.get('Authorization')).toBe('merchant-token')
  })
})
