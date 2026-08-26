import { afterEach, describe, expect, it } from 'vitest'
import { setToken } from '../../utils/token'
import request from '../../utils/request'
import { getMerchantProducts } from '../product'

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

describe('merchant product API', () => {
  it('requests the token-scoped product list with only the documented query', async () => {
    setToken('merchant-token')
    let observedConfig
    const productPage = {
      total: 1,
      list: [
        {
          product: {
            id: 7,
            categoryId: 21,
            brandId: 1,
            shopId: 1,
            name: 'HUAWEI MateBook X Pro',
            subtitle: '14.2 寸全面屏 | 酷睿 Ultra 7',
            mainImage: 'https://picsum.photos/seed/p7/400/400',
            images: null,
            detail: null,
            status: 1,
            salesCount: 12,
            sortOrder: 4,
            createTime: '2026-08-14 13:47:29',
            updateTime: '2026-08-15 13:18:20',
            deleted: 0,
          },
          minPrice: 13999,
          totalStock: 100,
          maxPrice: 17999,
        },
      ],
      page: 2,
      size: 20,
    }
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: productPage })
    }

    const result = await getMerchantProducts({
      keyword: 'Mate',
      status: 1,
      page: 2,
      size: 20,
    })

    expect(observedConfig.url).toBe('/merchant/products')
    expect(observedConfig.params).toEqual({
      keyword: 'Mate',
      status: 1,
      page: 2,
      size: 20,
    })
    expect(observedConfig.params).not.toHaveProperty('shopId')
    expect(observedConfig.headers.get('Authorization')).toBe('merchant-token')
    expect(result).toEqual(productPage)
  })
})
