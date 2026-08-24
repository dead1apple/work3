import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'

import * as access from '../src/router/access.js'
import { useUserStore } from '../src/store/user.js'

const makeRoute = ({
  path,
  name = path.slice(1) || 'home',
  query = {},
  records = [{}],
}) => ({
  path,
  fullPath: path,
  name,
  query,
  matched: records.map((meta) => ({ meta })),
})

const makeStore = ({ token = '', role = null, initialized = true, restoreSession } = {}) => ({
  token,
  userInfo: token ? { id: 1, username: 'tester', status: 1, role } : null,
  role,
  sessionInitialized: initialized,
  get isLoggedIn() { return Boolean(this.token) },
  restoreSession: restoreSession || (async () => null),
})

const createGuard = (store) => access.createRoleAwareGuard(() => store)
const protectedRoute = (path, roles) => makeRoute({
  path,
  records: [{ requiresAuth: true, ...(roles ? { roles } : {}) }],
})

test('an unauthenticated visitor can access a public storefront route', async () => {
  const result = await createGuard(makeStore())(makeRoute({ path: '/home', records: [{ public: true }] }))
  assert.equal(result, true)
})

test('an unauthenticated visitor is sent from cart to login with its internal target', async () => {
  const result = await createGuard(makeStore())(protectedRoute('/cart'))
  assert.deepEqual(result, { name: 'login', query: { redirect: '/cart' } })
})

test('an unauthenticated visitor is sent from merchant console to login', async () => {
  const result = await createGuard(makeStore())(protectedRoute('/merchant', [1]))
  assert.deepEqual(result, { name: 'login', query: { redirect: '/merchant' } })
})

test('an unauthenticated visitor is sent from admin console to login', async () => {
  const result = await createGuard(makeStore())(protectedRoute('/admin', [2]))
  assert.deepEqual(result, { name: 'login', query: { redirect: '/admin' } })
})

test('a regular user is forbidden from both consoles', async () => {
  const guard = createGuard(makeStore({ token: 'token', role: 0 }))
  assert.deepEqual(await guard(protectedRoute('/merchant', [1])), { name: 'forbidden' })
  assert.deepEqual(await guard(protectedRoute('/admin', [2])), { name: 'forbidden' })
})

test('a merchant can enter merchant console but not admin console', async () => {
  const guard = createGuard(makeStore({ token: 'token', role: 1 }))
  assert.equal(await guard(protectedRoute('/merchant', [1])), true)
  assert.deepEqual(await guard(protectedRoute('/admin', [2])), { name: 'forbidden' })
})

test('an administrator can enter admin console but not merchant console', async () => {
  const guard = createGuard(makeStore({ token: 'token', role: 2 }))
  assert.equal(await guard(protectedRoute('/admin', [2])), true)
  assert.deepEqual(await guard(protectedRoute('/merchant', [1])), { name: 'forbidden' })
})

test('invalid numeric and string roles cannot enter admin console', async () => {
  for (const role of [99, '2']) {
    const result = await createGuard(makeStore({ token: 'token', role }))(protectedRoute('/admin', [2]))
    assert.deepEqual(result, { name: 'forbidden' })
  }
})

test('parent route authentication and role meta apply to a nested child route', async () => {
  const nestedAdminRoute = makeRoute({
    path: '/admin/settings',
    records: [{ requiresAuth: true, roles: [2] }, { title: '设置' }],
  })

  assert.deepEqual(await createGuard(makeStore())(nestedAdminRoute), {
    name: 'login',
    query: { redirect: '/admin/settings' },
  })
  assert.deepEqual(
    await createGuard(makeStore({ token: 'token', role: 1 }))(nestedAdminRoute),
    { name: 'forbidden' },
  )
  assert.equal(await createGuard(makeStore({ token: 'token', role: 2 }))(nestedAdminRoute), true)
})

test('guard waits for session restoration before authorizing a role route', async () => {
  const events = []
  const store = makeStore({
    token: 'token',
    initialized: false,
    restoreSession: async () => {
      events.push('restore')
      store.role = 2
      store.userInfo = { id: 1, username: 'admin', status: 1, role: 2 }
      store.sessionInitialized = true
    },
  })

  const result = await createGuard(store)(protectedRoute('/admin', [2]))

  assert.deepEqual(events, ['restore'])
  assert.equal(result, true)
})

test('router and startup restoration share the user store single-flight request', async () => {
  const previousStorage = globalThis.localStorage
  globalThis.localStorage = {
    getItem: (key) => key === 'token' ? 'active-token' : null,
    setItem: () => {},
    removeItem: () => {},
  }

  try {
    setActivePinia(createPinia())
    const store = useUserStore()
    let requests = 0
    let resolveUser
    const fetchUserInfo = () => {
      requests += 1
      return new Promise((resolve) => { resolveUser = resolve })
    }
    const originalRestore = store.restoreSession.bind(store)
    store.restoreSession = () => originalRestore({ fetchUserInfo })

    const startupRestore = store.restoreSession()
    const navigation = createGuard(store)(protectedRoute('/admin', [2]))
    assert.equal(requests, 1)

    resolveUser({ id: 1, username: 'admin', status: 1, role: 2 })
    await startupRestore
    assert.equal(await navigation, true)
    assert.equal(requests, 1)
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})

test('forbidden navigation preserves the authenticated session', async () => {
  const store = makeStore({ token: 'active-token', role: 0 })

  const result = await createGuard(store)(protectedRoute('/admin', [2]))

  assert.deepEqual(result, { name: 'forbidden' })
  assert.equal(store.token, 'active-token')
  assert.deepEqual(store.userInfo, { id: 1, username: 'tester', status: 1, role: 0 })
  assert.equal(store.isLoggedIn, true)
})

test('a safe login redirect is chosen before the role default and remains guard-authorized', async () => {
  const store = makeStore({ token: 'admin-token', role: 2 })
  const loginRoute = makeRoute({
    path: '/login',
    name: 'login',
    query: { redirect: '/admin' },
    records: [{ public: true }],
  })

  assert.equal(await createGuard(store)(loginRoute), '/admin')
  assert.equal(await createGuard(store)(protectedRoute('/admin', [2])), true)

  const regularStore = makeStore({ token: 'user-token', role: 0 })
  assert.equal(await createGuard(regularStore)(loginRoute), '/admin')
  assert.deepEqual(await createGuard(regularStore)(protectedRoute('/admin', [2])), { name: 'forbidden' })
})

test('login without a safe redirect uses the role default destination', () => {
  assert.equal(access.resolvePostLoginDestination(undefined, 0), '/home')
  assert.equal(access.resolvePostLoginDestination(undefined, 1), '/merchant')
  assert.equal(access.resolvePostLoginDestination(undefined, 2), '/admin')
  assert.equal(access.resolvePostLoginDestination(undefined, 99), '/home')
})

test('external, executable, protocol-relative and auth-loop redirects are rejected', () => {
  for (const redirect of ['https://evil.example.com', '//evil.example.com', 'javascript:alert(1)']) {
    assert.equal(access.resolvePostLoginDestination(redirect, 2), '/admin')
  }
  assert.equal(access.resolvePostLoginDestination('/login', 1), '/merchant')
  assert.equal(access.resolvePostLoginDestination('/register', 2), '/admin')
})

test('the forbidden page is public and cannot redirect itself in a loop', async () => {
  const forbiddenRoute = makeRoute({ path: '/403', name: 'forbidden', records: [{ public: true }] })
  assert.equal(await createGuard(makeStore())(forbiddenRoute), true)
  assert.equal(await createGuard(makeStore({ token: 'token', role: 0 }))(forbiddenRoute), true)
})

test('merchant onboarding allows regular users and merchants', async () => {
  const onboarding = protectedRoute('/merchant/apply', [0, 1])
  assert.equal(await createGuard(makeStore({ token: 'user-token', role: 0 }))(onboarding), true)
  assert.equal(await createGuard(makeStore({ token: 'merchant-token', role: 1 }))(onboarding), true)
})

test('merchant onboarding sends an unauthenticated visitor to login with redirect', async () => {
  const result = await createGuard(makeStore())(protectedRoute('/merchant/apply', [0, 1]))
  assert.deepEqual(result, { name: 'login', query: { redirect: '/merchant/apply' } })
})

test('merchant onboarding rejects administrators', async () => {
  const result = await createGuard(makeStore({ token: 'admin-token', role: 2 }))(
    protectedRoute('/merchant/apply', [0, 1]),
  )
  assert.deepEqual(result, { name: 'forbidden' })
})

test('merchant onboarding does not weaken the merchant console role boundary', async () => {
  const guard = createGuard(makeStore({ token: 'user-token', role: 0 }))
  assert.equal(await guard(protectedRoute('/merchant/apply', [0, 1])), true)
  assert.deepEqual(await guard(protectedRoute('/merchant', [1])), { name: 'forbidden' })
})
