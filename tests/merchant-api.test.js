import test from 'node:test'
import assert from 'node:assert/strict'

import * as merchantApi from '../src/api/merchant.js'
import request from '../src/utils/request.js'

const captureRequest = async (invoke) => {
  const previousAdapter = request.defaults.adapter
  const hadLocalStorage = Object.hasOwn(globalThis, 'localStorage')
  const previousLocalStorage = globalThis.localStorage
  let captured
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
  request.defaults.adapter = async (config) => {
    captured = config
    return {
      config,
      data: { code: 1, msg: 'success', data: null },
      headers: {},
      status: 200,
      statusText: 'OK',
    }
  }

  try {
    await invoke()
  } finally {
    request.defaults.adapter = previousAdapter
    if (hadLocalStorage) globalThis.localStorage = previousLocalStorage
    else delete globalThis.localStorage
  }

  const data = typeof captured?.data === 'string' ? JSON.parse(captured.data) : captured?.data
  return {
    method: captured?.method,
    url: captured?.url,
    params: captured?.params,
    data,
  }
}

const shop = {
  id: 100,
  userId: 10,
  shopName: '测试店铺',
  logo: 'https://example.com/logo.png',
  description: '测试简介',
  licenseImage: 'https://example.com/license.png',
  status: 0,
  rating: 4.8,
  location: '116.397428,39.90923',
  address: '测试地址',
  createTime: '2026-08-24 10:00:00',
  updateTime: '2026-08-24 10:00:00',
}

const product = {
  id: 20,
  categoryId: 3,
  brandId: 4,
  name: '测试商品',
  subtitle: '测试副标题',
  mainImage: 'https://example.com/main.png',
  images: ['https://example.com/1.png'],
  detail: '<p>商品详情</p>',
  status: 2,
  skuList: [{
    id: 30,
    skuName: '黑色 128G',
    specValues: '{"颜色":"黑色","容量":"128G"}',
    price: 1999,
    marketPrice: 2199,
    stock: 50,
    image: 'https://example.com/sku.png',
  }],
}

const deliverPayload = {
  orderNo: 'JD202608240001',
  logisticsNo: 'SF1234567890',
  logisticsCompany: '顺丰快递',
}

const cases = [
  ['getMyShop', [], { method: 'get', url: '/merchant/shop', params: undefined, data: undefined }],
  ['updateMyShop', [shop], { method: 'put', url: '/merchant/shop', params: undefined, data: shop }],
  ['applyForShop', [shop], { method: 'post', url: '/merchant/shop/apply', params: undefined, data: shop }],
  ['getMerchantProducts', [{ keyword: '手机', status: 0, page: 2, size: 20 }], {
    method: 'get',
    url: '/merchant/products',
    params: { keyword: '手机', status: 0, page: 2, size: 20 },
    data: undefined,
  }],
  ['createMerchantProduct', [product], { method: 'post', url: '/merchant/products', params: undefined, data: product }],
  ['updateMerchantProduct', [product], { method: 'put', url: '/merchant/products', params: undefined, data: product }],
  ['updateMerchantProductStatus', [20, 0], {
    method: 'put',
    url: '/merchant/products/20/status',
    params: { status: 0 },
    data: null,
  }],
  ['getMerchantOrders', [{ status: 1, page: 3, size: 15 }], {
    method: 'get',
    url: '/merchant/orders',
    params: { status: 1, page: 3, size: 15 },
    data: undefined,
  }],
  ['deliverOrder', [deliverPayload], { method: 'post', url: '/merchant/orders/deliver', params: undefined, data: deliverPayload }],
]

for (const [name, args, expected] of cases) {
  test(`${name} sends the documented merchant request`, async () => {
    assert.equal(typeof merchantApi[name], 'function', `${name} must be exported`)
    assert.deepEqual(await captureRequest(() => merchantApi[name](...args)), expected)
  })
}
