import { afterEach, describe, expect, it } from 'vitest'
import request from '../../utils/request'
import { getBrands, getCategoryTree } from '../catalog'

const originalAdapter = request.defaults.adapter

function response(config, data) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

afterEach(() => {
  request.defaults.adapter = originalAdapter
})

describe('public product catalog API', () => {
  it('loads the exact category tree endpoint', async () => {
    const tree = [{ category: { id: 1, name: '手机数码' }, children: [] }]
    let observedConfig
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: tree })
    }

    await expect(getCategoryTree()).resolves.toEqual(tree)
    expect(observedConfig.method).toBe('get')
    expect(observedConfig.url).toBe('/categories/tree')
  })

  it('loads the exact non-paginated brands endpoint', async () => {
    const brands = [{ id: 1, name: '华为', status: 1 }]
    let observedConfig
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: brands })
    }

    await expect(getBrands()).resolves.toEqual(brands)
    expect(observedConfig.method).toBe('get')
    expect(observedConfig.url).toBe('/brands')
  })
})
