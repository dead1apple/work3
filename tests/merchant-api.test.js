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

const application = {
  shopName: '测试店铺',
  logo: 'https://example.com/logo.png',
  description: '测试简介',
  licenseImage: 'https://example.com/license.png',
  location: '116.397428,39.90923',
  address: '测试地址',
}

const cases = [
  ['getMyShop', [], { method: 'get', url: '/merchant/shop', params: undefined, data: undefined }],
  ['applyForShop', [application], { method: 'post', url: '/merchant/shop/apply', params: undefined, data: application }],
]

for (const [name, args, expected] of cases) {
  test(`${name} sends the documented merchant request`, async () => {
    assert.equal(typeof merchantApi[name], 'function', `${name} must be exported`)
    assert.deepEqual(await captureRequest(() => merchantApi[name](...args)), expected)
  })
}
