import { afterEach, describe, expect, it } from 'vitest'
import { setToken } from '../../utils/token'
import request from '../../utils/request'
import {
  createMerchantProduct,
  getMerchantProduct,
  getMerchantProducts,
  updateMerchantProduct,
  updateMerchantProductStatus,
  uploadMerchantImage,
} from '../product'

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

  it('posts the explicit create DTO without identity, status, or shop fields', async () => {
    setToken('merchant-token')
    let observedConfig
    const payload = {
      categoryId: 11,
      brandId: 1,
      name: 'Codex 商家端测试商品',
      subtitle: null,
      mainImage: null,
      images: [],
      detail: null,
      skuList: [
        {
          skuName: '默认款',
          specValues: '{"颜色":"黑色"}',
          price: 99,
          marketPrice: null,
          stock: 10,
          image: null,
        },
      ],
    }
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: 108 })
    }

    const result = await createMerchantProduct(payload)

    expect(observedConfig.method).toBe('post')
    expect(observedConfig.url).toBe('/merchant/products')
    expect(JSON.parse(observedConfig.data)).toEqual(payload)
    expect(observedConfig.data).not.toContain('shopId')
    expect(observedConfig.data).not.toContain('status')
    expect(observedConfig.data).not.toContain('"id"')
    expect(result).toBe(108)
  })

  it('puts only the documented target status for the token-scoped product', async () => {
    setToken('merchant-token')
    let observedConfig
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: 'success', data: {} })
    }

    await updateMerchantProductStatus(7, 0)

    expect(observedConfig.method).toBe('put')
    expect(observedConfig.url).toBe('/merchant/products/7/status')
    expect(observedConfig.params).toEqual({ status: 0 })
    expect(observedConfig.params).not.toHaveProperty('shopId')
    expect(observedConfig.headers.get('Authorization')).toBe('merchant-token')
  })

  it('gets and updates a complete token-scoped ProductDTO without shopId', async () => {
    setToken('merchant-token')
    const configs = []
    request.defaults.adapter = async (config) => {
      configs.push(config)
      return response(config, { code: 1, msg: 'success', data: { product: { id: 73 }, skuList: [] } })
    }
    const payload = { id: 73, categoryId: 11, brandId: 1, name: '测试商品', skuList: [{ id: 271, skuName: '默认款', price: 99, stock: 1 }] }

    await getMerchantProduct(73)
    await updateMerchantProduct(payload)

    expect(configs[0].url).toBe('/merchant/products/73')
    expect(configs[0].method).toBe('get')
    expect(configs[1].url).toBe('/merchant/products')
    expect(configs[1].method).toBe('put')
    expect(JSON.parse(configs[1].data)).toEqual(payload)
    expect(configs[1].data).not.toContain('shopId')
    expect(configs[1].headers.get('Authorization')).toBe('merchant-token')
  })

  it('uploads a file as multipart form data using the documented file field', async () => {
    let observedConfig
    request.defaults.adapter = async (config) => {
      observedConfig = config
      return response(config, { code: 1, msg: '上传成功', data: { url: 'https://cdn.test/image.png' } })
    }
    const file = new File(['image'], 'image.png', { type: 'image/png' })

    await expect(uploadMerchantImage(file)).resolves.toEqual({ url: 'https://cdn.test/image.png' })

    expect(observedConfig.method).toBe('post')
    expect(observedConfig.url).toBe('/merchant/uploads/images')
    expect(observedConfig.data).toBeInstanceOf(FormData)
    expect(observedConfig.data.get('file')).toBe(file)
  })
})
