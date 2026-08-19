import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import {
  createRegistrationCodeSender,
  clearAuthStorage,
  getAuthToken,
  isCurrentRequestToken,
  normalizeMainlandMobile,
  readAuthToken,
  resolveRedirect,
  writeAuthToken,
} from '../src/utils/auth.js'
import { useUserStore } from '../src/store/user.js'
import request from '../src/utils/request.js'

const fakeStorage = (initialEntries = {}) => {
  const values = new Map(Object.entries(initialEntries))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    entries: () => Object.fromEntries(values),
  }
}

test('extracts token from a successful login payload', () => {
  assert.equal(getAuthToken({ accessToken: 'access-token' }), 'access-token')
  assert.equal(getAuthToken({ data: { token: 'nested-token' } }), 'nested-token')
})

test('only accepts safe same-origin redirect paths', () => {
  assert.equal(resolveRedirect('/cart?from=login'), '/cart?from=login')
  assert.equal(resolveRedirect('https://example.com'), '/home')
  assert.equal(resolveRedirect('//example.com'), '/home')
})

test('clears all supported authentication token keys on logout', () => {
  const removed = []
  clearAuthStorage({ removeItem: (key) => removed.push(key) })
  assert.deepEqual(removed, ['token', 'access_token'])
})

test('reads both supported token keys through one boundary', () => {
  assert.equal(readAuthToken(fakeStorage({ access_token: 'legacy' })), 'legacy')
  assert.equal(readAuthToken(fakeStorage({ token: 'current', access_token: 'legacy' })), 'current')
})

test('session invalidation removes tokens and persisted cart', () => {
  const storage = fakeStorage({ token: 'A', access_token: 'B', cart: '{"cartList":[]}' })
  clearAuthStorage(storage, { clearCart: true })
  assert.deepEqual(storage.entries(), {})
})

test('starting a session stores one canonical token without retaining an alias', () => {
  const storage = fakeStorage({ access_token: 'legacy' })
  writeAuthToken('current', storage)
  assert.deepEqual(storage.entries(), { token: 'current' })
})

test('an old request token cannot invalidate a newer login', () => {
  const storage = fakeStorage({ token: 'new-token' })
  assert.equal(isCurrentRequestToken('old-token', storage), false)
  assert.equal(isCurrentRequestToken('new-token', storage), true)
})

test('user store restores a legacy token and replaces it with the canonical key', () => {
  const previousStorage = globalThis.localStorage
  const storage = fakeStorage({ access_token: 'legacy' })
  globalThis.localStorage = storage

  try {
    setActivePinia(createPinia())
    const userStore = useUserStore()
    assert.equal(userStore.token, 'legacy')

    userStore.setSession('current')
    assert.deepEqual(storage.entries(), { token: 'current' })
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})

test('a late 401 cannot clear a newer session or redirect away from it', async () => {
  const previousStorage = globalThis.localStorage
  const previousWindow = globalThis.window
  const storage = fakeStorage({ token: 'old-token', cart: '{"cartList":[]}' })
  const window = { location: { pathname: '/cart', search: '', href: '/cart' } }
  globalThis.localStorage = storage
  globalThis.window = window

  try {
    await assert.rejects(
      request.get('/profile', {
        adapter: (config) => {
          storage.setItem('token', 'new-token')
          return Promise.resolve({
            config,
            data: { code: 401, msg: 'expired' },
            headers: {},
            status: 200,
            statusText: 'OK',
          })
        },
      }),
      (error) => error.code === 401,
    )

    assert.deepEqual(storage.entries(), { token: 'new-token', cart: '{"cartList":[]}' })
    assert.equal(window.location.href, '/cart')
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test('HTTP 403 keeps the active session and exposes its numeric status', async () => {
  const previousStorage = globalThis.localStorage
  const storage = fakeStorage({ token: 'active-token', cart: '{"cartList":[]}' })
  globalThis.localStorage = storage

  try {
    await assert.rejects(
      request.get('/forbidden', {
        adapter: (config) => Promise.reject({ response: { config, status: 403 } }),
      }),
      (error) => error.code === 403,
    )
    assert.deepEqual(storage.entries(), { token: 'active-token', cart: '{"cartList":[]}' })
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})

test('a string envelope 401 invalidates the matching session and cart', async () => {
  const previousStorage = globalThis.localStorage
  const previousWindow = globalThis.window
  const storage = fakeStorage({ token: 'expired-token', cart: '{"cartList":[]}' })
  const window = { location: { pathname: '/cart', search: '?tab=all', href: '/cart?tab=all' } }
  globalThis.localStorage = storage
  globalThis.window = window

  try {
    await assert.rejects(
      request.get('/expired', {
        adapter: (config) => Promise.resolve({
          config,
          data: { code: '401', msg: 'expired' },
          headers: {},
          status: 200,
          statusText: 'OK',
        }),
      }),
      (error) => error.code === 401,
    )
    assert.deepEqual(storage.entries(), {})
    assert.equal(window.location.href, '/login?redirect=%2Fcart%3Ftab%3Dall')
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test('a new in-place session is invalidated after a prior 401 on the login page', async () => {
  const previousStorage = globalThis.localStorage
  const previousWindow = globalThis.window
  const storage = fakeStorage({ token: 'first-token', cart: '{"cartList":[]}' })
  const window = { location: { pathname: '/login', search: '', href: '/login' } }
  globalThis.localStorage = storage
  globalThis.window = window
  const isolatedRequest = (await import('../src/utils/request.js?two-session-401')).default

  const matching401 = () => isolatedRequest.get('/expired', {
    adapter: (config) => Promise.resolve({
      config,
      data: { code: 401, msg: 'expired' },
      headers: {},
      status: 200,
      statusText: 'OK',
    }),
  })

  try {
    await assert.rejects(matching401(), (error) => error.code === 401)
    assert.deepEqual(storage.entries(), {})
    assert.equal(window.location.href, '/login')

    writeAuthToken('second-token', storage)
    storage.setItem('cart', '{"cartList":[]}')
    window.location.pathname = '/cart'
    window.location.search = '?from=login'
    window.location.href = '/cart?from=login'

    await assert.rejects(matching401(), (error) => error.code === 401)
    assert.deepEqual(storage.entries(), {})
    assert.equal(window.location.href, '/login?redirect=%2Fcart%3Ffrom%3Dlogin')
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test('normalizes only trimmed mainland mobile numbers for registration codes', () => {
  assert.equal(normalizeMainlandMobile(' 13800138000 '), '13800138000')
  assert.throws(() => normalizeMainlandMobile('12800138000'), /有效的 11 位手机号/)
  assert.throws(() => normalizeMainlandMobile('1380013800'), /有效的 11 位手机号/)
})

test('registration code sender is single-flight and starts countdown only after success', async () => {
  let resolveSend
  const calls = []
  const states = []
  const sender = createRegistrationCodeSender({
    seconds: 3,
    sendCode: (payload) => {
      calls.push(payload)
      return new Promise((resolve) => { resolveSend = resolve })
    },
    setInterval: () => 101,
    clearInterval: () => {},
    onStateChange: (state) => states.push(state),
  })

  const first = sender.send(' 13800138000 ')
  const second = sender.send('13900139000')

  assert.equal(second, false)
  assert.deepEqual(calls, [{ phone: '13800138000' }])
  assert.equal(sender.disabled, true)
  assert.equal(sender.countdown, 0)

  resolveSend()
  assert.equal(await first, true)
  assert.equal(sender.countdown, 3)
  assert.equal(sender.sending, false)
  assert.equal(sender.disabled, true)
  assert.equal(sender.send('13900139000'), false)
  assert.ok(states.some((state) => state.sending === true && state.countdown === 0 && state.disabled === true))
  assert.ok(states.some((state) => state.sending === false && state.countdown === 3 && state.disabled === true))
})

test('registration code sender does not start countdown when sending fails', async () => {
  const sender = createRegistrationCodeSender({
    sendCode: () => Promise.reject(new Error('network down')),
    setInterval: () => { throw new Error('countdown should not start') },
    clearInterval: () => {},
  })

  await assert.rejects(sender.send('13800138000'), /network down/)
  assert.equal(sender.countdown, 0)
  assert.equal(sender.sending, false)
  assert.equal(sender.disabled, false)
})

test('registration code sender ticks down and clears its interval on cleanup', async () => {
  let tick
  const cleared = []
  const sender = createRegistrationCodeSender({
    seconds: 2,
    sendCode: () => Promise.resolve(),
    setInterval: (callback) => {
      tick = callback
      return 202
    },
    clearInterval: (id) => cleared.push(id),
  })

  await sender.send('13800138000')
  assert.equal(sender.countdown, 2)

  tick()
  assert.equal(sender.countdown, 1)

  sender.cleanup()
  assert.deepEqual(cleared, [202])
  assert.equal(sender.countdown, 0)
  assert.equal(sender.disabled, false)
})
