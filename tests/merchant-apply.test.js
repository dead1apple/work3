import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'

import * as merchantShop from '../src/utils/merchantShop.js'
import { useUserStore } from '../src/store/user.js'

const documentedShop = (status, overrides = {}) => ({
  id: 10,
  userId: 1,
  shopName: '真实店铺',
  logo: 'https://example.com/logo.png',
  description: '店铺简介',
  licenseImage: 'https://example.com/license.png',
  status,
  rating: 0,
  location: '上海市',
  address: '浦东新区测试路 1 号',
  createTime: '2026-08-24 10:00:00',
  updateTime: '2026-08-24 10:00:00',
  ...overrides,
})

const applicationForm = (overrides = {}) => ({
  shopName: '  测试店铺  ',
  logo: ' https://example.com/logo.png ',
  description: '  简介  ',
  licenseImage: ' https://example.com/license.png ',
  location: '  上海市  ',
  address: '  测试路 1 号  ',
  ...overrides,
})

test('shop status uses only documented numeric values', () => {
  assert.equal(merchantShop.getMerchantShopView(documentedShop(0), 0).kind, 'pending')
  assert.equal(merchantShop.getMerchantShopView(documentedShop(1), 1).kind, 'active')
  assert.equal(merchantShop.getMerchantShopView(documentedShop(1), 0).kind, 'role-unsynced')
  assert.equal(merchantShop.getMerchantShopView(documentedShop(2), 1).kind, 'disabled')
  assert.equal(merchantShop.getMerchantShopView(documentedShop(3), 0).kind, 'rejected')
  assert.equal(merchantShop.getMerchantShopView(documentedShop(99), 0).kind, 'unknown')
  assert.equal(merchantShop.getMerchantShopView(documentedShop('1'), 1).kind, 'unknown')
})

test('a missing shop exposes the first application state', () => {
  const view = merchantShop.getMerchantShopView(null, 0)
  assert.equal(view.kind, 'empty')
  assert.equal(view.canApply, true)
})

test('status one permits console entry only after the trusted role is merchant', () => {
  assert.equal(merchantShop.getMerchantShopView(documentedShop(1), 1).canEnterMerchant, true)
  assert.equal(merchantShop.getMerchantShopView(documentedShop(1), 0).canEnterMerchant, false)
  assert.equal(merchantShop.getMerchantShopView(documentedShop(1), 0).canRefreshUser, true)
})

test('disabled, rejected and unknown shops expose no write or console action', () => {
  for (const status of [2, 3, 99, '3']) {
    const view = merchantShop.getMerchantShopView(documentedShop(status), 0)
    assert.equal(view.canApply, false)
    assert.equal(view.canEnterMerchant, false)
    assert.equal(view.canRefreshUser, false)
  }
})

test('application payload trims and allowlists only documented business inputs', () => {
  assert.deepEqual(
    merchantShop.buildShopApplicationPayload({
      ...applicationForm(),
      id: 99,
      userId: 8,
      status: 1,
      rating: 5,
      createTime: 'internal',
      updateTime: 'internal',
    }),
    {
      shopName: '测试店铺',
      logo: 'https://example.com/logo.png',
      description: '简介',
      licenseImage: 'https://example.com/license.png',
      location: '上海市',
      address: '测试路 1 号',
    },
  )
})

test('application validation rejects a whitespace-only shop name', () => {
  assert.deepEqual(merchantShop.validateShopApplication(applicationForm({ shopName: '   ' })), {
    shopName: '请输入店铺名称',
  })
})

test('application validation accepts empty optional image URLs and rejects invalid ones', () => {
  assert.deepEqual(
    merchantShop.validateShopApplication(applicationForm({ logo: '', licenseImage: '' })),
    {},
  )
  assert.deepEqual(
    merchantShop.validateShopApplication(applicationForm({ logo: 'logo.png', licenseImage: 'ftp://example.com/a.png' })),
    {
      logo: '请输入有效的 http(s) 或站内图片地址',
      licenseImage: '请输入有效的 http(s) 或站内图片地址',
    },
  )
})

test('initial shop loading distinguishes a real null result from a request failure', async () => {
  const emptyFlow = merchantShop.createMerchantShopFlow({
    getShop: async () => null,
    applyShop: async () => {},
  })
  await emptyFlow.load()
  assert.equal(emptyFlow.shop, null)
  assert.equal(emptyFlow.loadError, null)

  const failure = new Error('店铺读取失败')
  const failedFlow = merchantShop.createMerchantShopFlow({
    getShop: async () => { throw failure },
    applyShop: async () => {},
  })
  await failedFlow.load()
  assert.equal(failedFlow.shop, undefined)
  assert.equal(failedFlow.loadError, failure)
  assert.equal(failedFlow.submittedUnconfirmed, false)
})

test('double submission produces one POST and one server-truth refresh', async () => {
  let applyCalls = 0
  let getCalls = 0
  let resolveApply
  const flow = merchantShop.createMerchantShopFlow({
    applyShop: () => {
      applyCalls += 1
      return new Promise((resolve) => { resolveApply = resolve })
    },
    getShop: async () => {
      getCalls += 1
      return documentedShop(0)
    },
  })

  const first = flow.submit(applicationForm())
  const second = flow.submit(applicationForm({ shopName: '另一个店铺' }))
  assert.equal(applyCalls, 1)

  resolveApply()
  await Promise.all([first, second])
  assert.equal(getCalls, 1)
  assert.equal(flow.shop.status, 0)
  assert.equal(flow.submitting, false)
})

test('successful application commits only the shop returned by the following GET', async () => {
  const events = []
  const serverShop = documentedShop(0)
  const flow = merchantShop.createMerchantShopFlow({
    applyShop: async (payload) => { events.push(['post', payload]) },
    getShop: async () => { events.push(['get']); return serverShop },
  })

  await flow.submit(applicationForm())

  assert.deepEqual(events.map(([type]) => type), ['post', 'get'])
  assert.equal(flow.shop, serverShop)
  assert.equal(flow.submittedUnconfirmed, false)
})

test('successful POST followed by null keeps a non-submittable unconfirmed state', async () => {
  const flow = merchantShop.createMerchantShopFlow({
    applyShop: async () => {},
    getShop: async () => null,
  })

  await flow.submit(applicationForm())

  assert.equal(flow.shop, null)
  assert.equal(flow.submittedUnconfirmed, true)
  assert.equal(flow.confirmationError, null)
})

test('successful POST followed by GET failure is not treated as initial load failure or empty shop', async () => {
  const failure = new Error('状态回读失败')
  const flow = merchantShop.createMerchantShopFlow({
    applyShop: async () => {},
    getShop: async () => { throw failure },
  })

  await flow.submit(applicationForm())

  assert.equal(flow.submittedUnconfirmed, true)
  assert.equal(flow.confirmationError, failure)
  assert.equal(flow.loadError, null)
  assert.equal(flow.shop, undefined)
})

test('failed POST keeps form values and does not enter submitted state', async () => {
  const form = applicationForm()
  const original = { ...form }
  const failure = new Error('申请失败')
  const flow = merchantShop.createMerchantShopFlow({
    applyShop: async () => { throw failure },
    getShop: async () => { throw new Error('GET must not run') },
  })

  await flow.submit(form)

  assert.deepEqual(form, original)
  assert.equal(flow.submissionError, failure)
  assert.equal(flow.submittedUnconfirmed, false)
  assert.equal(flow.shop, undefined)
})

test('post-submit refresh invalidates an older initial GET result', async () => {
  let resolveInitialGet
  let getCalls = 0
  const approvedState = documentedShop(0)
  const flow = merchantShop.createMerchantShopFlow({
    applyShop: async () => {},
    getShop: () => {
      getCalls += 1
      if (getCalls === 1) return new Promise((resolve) => { resolveInitialGet = resolve })
      return Promise.resolve(approvedState)
    },
  })

  const initialLoad = flow.load()
  await flow.submit(applicationForm())
  resolveInitialGet(null)
  await initialLoad

  assert.equal(flow.shop, approvedState)
  assert.equal(flow.submittedUnconfirmed, false)
})

test('profile role entry routes each trusted role to its matching destination', () => {
  assert.deepEqual(merchantShop.getMerchantProfileEntry(0), { label: '商家入驻', path: '/merchant/apply' })
  assert.deepEqual(merchantShop.getMerchantProfileEntry(1), { label: '商家中心', path: '/merchant' })
  assert.deepEqual(merchantShop.getMerchantProfileEntry(2), { label: '管理后台', path: '/admin' })
})

test('profile role entry is hidden for missing, string and unsupported roles', () => {
  for (const role of [null, undefined, '2', 99]) {
    assert.equal(merchantShop.getMerchantProfileEntry(role), null)
  }
})

test('refreshUserInfo bypasses initialized-session reuse and stores the fresh role', async () => {
  const previousStorage = globalThis.localStorage
  globalThis.localStorage = {
    getItem: (key) => key === 'token' ? 'active-token' : null,
    setItem: () => {},
    removeItem: () => {},
  }

  try {
    setActivePinia(createPinia())
    const store = useUserStore()
    store.setUserInfo({ id: 1, username: 'user', status: 1, role: 0 })
    store.sessionInitialized = true
    let requests = 0

    await store.refreshUserInfo({
      fetchUserInfo: async () => {
        requests += 1
        return { id: 1, username: 'user', status: 1, role: 1 }
      },
    })

    assert.equal(requests, 1)
    assert.equal(store.role, 1)
    assert.equal(store.sessionInitialized, true)
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})
