import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'

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

const withUserStore = async (entries, run) => {
  const previousStorage = globalThis.localStorage
  const storage = fakeStorage(entries)
  globalThis.localStorage = storage

  try {
    setActivePinia(createPinia())
    await run(useUserStore(), storage)
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
}

test('store creation restores a token from localStorage', async () => {
  await withUserStore({ token: 'saved-token' }, async (store) => {
    assert.equal(store.token, 'saved-token')
  })
})

test('restoreSession without a token finishes without requesting user info', async () => {
  await withUserStore({}, async (store) => {
    let requests = 0
    store.setUserInfo({ id: 99, role: 2 })

    await store.restoreSession({ fetchUserInfo: async () => { requests += 1 } })

    assert.equal(requests, 0)
    assert.equal(store.userInfo, null)
    assert.equal(store.sessionInitialized, true)
    assert.equal(store.sessionRestoring, false)
  })
})

test('restoreSession saves the direct user info response including role zero', async () => {
  await withUserStore({ token: 'active-token' }, async (store) => {
    const user = { id: 1, username: 'user', nickname: '用户', status: 1, role: 0, password: null }

    await store.restoreSession({ fetchUserInfo: async () => user })

    assert.deepEqual(store.userInfo, { id: 1, username: 'user', nickname: '用户', status: 1, role: 0 })
    assert.equal(store.role, 0)
    assert.equal(store.isUser, true)
    assert.equal(store.isMerchant, false)
    assert.equal(store.isAdmin, false)
    assert.equal(store.sessionInitialized, true)
  })
})

test('role getters recognize merchant and administrator values', async () => {
  await withUserStore({}, async (store) => {
    store.setUserInfo({ role: 1 })
    assert.equal(store.role, 1)
    assert.equal(store.isMerchant, true)
    assert.equal(store.isAdmin, false)

    store.setUserInfo({ role: 2 })
    assert.equal(store.role, 2)
    assert.equal(store.isMerchant, false)
    assert.equal(store.isAdmin, true)
  })
})

test('missing and invalid roles never grant elevated access', async () => {
  await withUserStore({}, async (store) => {
    for (const role of [undefined, null, 'admin', '2', 99, Number.NaN]) {
      store.setUserInfo(role === undefined ? {} : { role })
      assert.equal(store.role, null)
      assert.equal(store.isUser, false)
      assert.equal(store.isMerchant, false)
      assert.equal(store.isAdmin, false)
    }
  })
})

test('concurrent restoreSession calls share one user info request', async () => {
  await withUserStore({ token: 'active-token' }, async (store) => {
    let requests = 0
    let resolveUser
    const fetchUserInfo = () => {
      requests += 1
      return new Promise((resolve) => { resolveUser = resolve })
    }

    const restores = [
      store.restoreSession({ fetchUserInfo }),
      store.restoreSession({ fetchUserInfo }),
      store.restoreSession({ fetchUserInfo }),
    ]
    assert.equal(requests, 1)

    resolveUser({ id: 1, username: 'user', status: 1, role: 0 })
    const results = await Promise.all(restores)
    assert.deepEqual(results, [store.userInfo, store.userInfo, store.userInfo])
  })
})

test('a successful restore is reused without another user info request', async () => {
  await withUserStore({ token: 'active-token' }, async (store) => {
    let requests = 0
    const fetchUserInfo = async () => {
      requests += 1
      return { id: 1, username: 'user', status: 1, role: 0 }
    }

    await store.restoreSession({ fetchUserInfo })
    await store.restoreSession({ fetchUserInfo })

    assert.equal(requests, 1)
  })
})

test('a transient restore failure keeps the stored token for a later retry', async () => {
  await withUserStore({ token: 'active-token' }, async (store, storage) => {
    await assert.rejects(
      store.restoreSession({ fetchUserInfo: async () => { throw new Error('network down') } }),
      /network down/,
    )

    assert.equal(store.token, 'active-token')
    assert.equal(store.userInfo, null)
    assert.equal(store.sessionInitialized, true)
    assert.deepEqual(storage.entries(), { token: 'active-token' })
  })
})

test('login establishes identity only from user info, not the login response user', async () => {
  await withUserStore({}, async (store, storage) => {
    await store.login(
      { username: 'user', password: 'secret' },
      {
        authenticate: async () => ({ token: 'new-token', user: { id: 999, role: 2 } }),
        fetchUserInfo: async () => ({ id: 1, username: 'user', status: 1, role: 0 }),
      },
    )

    assert.deepEqual(storage.entries(), { token: 'new-token' })
    assert.deepEqual(store.userInfo, { id: 1, username: 'user', status: 1, role: 0 })
    assert.equal(store.role, 0)
    assert.equal(store.sessionInitialized, true)
  })
})

test('login clears an incomplete session when user info loading fails', async () => {
  await withUserStore({}, async (store, storage) => {
    await assert.rejects(
      store.login(
        { username: 'user', password: 'secret' },
        {
          authenticate: async () => ({ accessToken: 'new-token' }),
          fetchUserInfo: async () => { throw new Error('profile unavailable') },
        },
      ),
      /profile unavailable/,
    )

    assert.equal(store.token, '')
    assert.equal(store.userInfo, null)
    assert.equal(store.isLoggedIn, false)
    assert.equal(store.sessionInitialized, true)
    assert.deepEqual(storage.entries(), {})
  })
})

test('clearSession removes storage and all in-memory identity state', async () => {
  await withUserStore({ token: 'active-token' }, async (store, storage) => {
    store.setUserInfo({ id: 1, role: 2 })
    store.clearSession()

    assert.equal(store.token, '')
    assert.equal(store.userInfo, null)
    assert.equal(store.role, null)
    assert.equal(store.isLoggedIn, false)
    assert.equal(store.sessionInitialized, true)
    assert.deepEqual(storage.entries(), {})
  })
})

test('a matching 401 clears both storage and the connected Pinia session', async () => {
  const previousWindow = globalThis.window
  globalThis.window = { location: { pathname: '/login', search: '', href: '/login' } }

  try {
    await withUserStore({ token: 'expired-token' }, async (store, storage) => {
      store.setUserInfo({ id: 1, role: 2 })
      const disconnect = store.connectSessionInvalidation()

      try {
        await assert.rejects(
          request.get('/expired', {
            adapter: (config) => Promise.resolve({
              config,
              data: { code: 401, msg: 'expired' },
              headers: {},
              status: 200,
              statusText: 'OK',
            }),
          }),
          (error) => error.code === 401,
        )
      } finally {
        disconnect()
      }

      assert.deepEqual(storage.entries(), {})
      assert.equal(store.token, '')
      assert.equal(store.userInfo, null)
      assert.equal(store.isLoggedIn, false)
    })
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
