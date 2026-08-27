import { afterEach, describe, expect, it } from 'vitest'
import { setToken } from '../../utils/token'
import request from '../../utils/request'
import {
  createMerchantCoupon,
  getMerchantCoupon,
  getMerchantCoupons,
  updateMerchantCoupon,
  updateMerchantCouponStatus,
} from '../coupon'

const originalAdapter = request.defaults.adapter

function response(config, data) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

afterEach(() => {
  request.defaults.adapter = originalAdapter
})

describe('merchant coupon API', () => {
  it('uses the token-scoped list endpoint and documented filters only', async () => {
    setToken('merchant-token')
    let observedConfig
    const page = { total: 1, list: [{ id: 6, name: '华为店 9 折折扣券' }], page: 1, size: 20 }
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: page })
    }

    await expect(getMerchantCoupons({ keyword: '华为', status: 1, page: 1, size: 20 })).resolves.toEqual(page)

    expect(observedConfig.url).toBe('/merchant/coupons')
    expect(observedConfig.params).toEqual({ keyword: '华为', status: 1, page: 1, size: 20 })
    expect(observedConfig.params).not.toHaveProperty('shopId')
    expect(observedConfig.headers.get('Authorization')).toBe('merchant-token')
  })

  it('creates and updates the MerchantCouponRequest without shop identity fields', async () => {
    const configs = []
    const payload = {
      name: '商家端自动化测试券', type: 1, amount: 20, minAmount: 100, totalCount: 10,
      startTime: '2026-08-28 00:00:00', endTime: '2026-08-29 23:59:59', status: 0,
    }
    request.defaults.adapter = async (config) => {
      configs.push(config)
      return response(config, { code: 1, msg: 'success', data: config.method === 'post' ? 8 : {} })
    }

    await createMerchantCoupon(payload)
    await updateMerchantCoupon(8, payload)
    await getMerchantCoupon(8)

    expect(configs.map((config) => [config.method, config.url])).toEqual([
      ['post', '/merchant/coupons'], ['put', '/merchant/coupons/8'], ['get', '/merchant/coupons/8'],
    ])
    expect(JSON.parse(configs[0].data)).toEqual(payload)
    expect(JSON.parse(configs[1].data)).toEqual(payload)
    expect(configs[0].data).not.toContain('shopId')
    expect(configs[1].data).not.toContain('shopId')
  })

  it('changes coupon status through the documented merchant endpoint without shopId', async () => {
    let observedConfig
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: {} })
    }

    await updateMerchantCouponStatus(6, 0)

    expect(observedConfig.method).toBe('put')
    expect(observedConfig.url).toBe('/merchant/coupons/6/status')
    expect(observedConfig.params).toEqual({ status: 0 })
    expect(observedConfig.params).not.toHaveProperty('shopId')
  })
})
