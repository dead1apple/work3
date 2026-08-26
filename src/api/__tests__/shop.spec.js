import { afterEach, describe, expect, it } from 'vitest'
import request from '../../utils/request'
import { updateCurrentShop } from '../shop'
import { setToken } from '../../utils/token'

const originalAdapter = request.defaults.adapter
function response(config, data) { return { data, status: 200, statusText: 'OK', headers: {}, config } }

afterEach(() => { request.defaults.adapter = originalAdapter })

describe('merchant shop API', () => {
  it('puts only editable current-shop fields without owner or server-managed fields', async () => {
    setToken('merchant-token')
    let observedConfig
    const payload = {
      shopName: '华为官方旗舰店', logo: 'https://cdn.test/logo.png', description: '官方直营店',
      licenseImage: 'https://cdn.test/license.png', location: '116.397428,39.90923', address: '北京市东城区',
    }
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: '修改成功', data: {} })
    }

    await updateCurrentShop(payload)

    expect(observedConfig.method).toBe('put')
    expect(observedConfig.url).toBe('/merchant/shop')
    expect(JSON.parse(observedConfig.data)).toEqual(payload)
    expect(observedConfig.data).not.toMatch(/userId|status|rating|createTime|updateTime/)
    expect(observedConfig.headers.get('Authorization')).toBe('merchant-token')
  })
})
