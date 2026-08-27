import { resolveRedirect } from '../utils/auth.js'

const AUTH_ROUTE_NAMES = new Set(['login', 'register'])

const defaultDestinationForRole = () => '/home'

const isExternalPortalPath = (path) => (
  path === '/admin'
  || path.startsWith('/admin/')
  || path === '/merchant'
  || (path.startsWith('/merchant/') && path !== '/merchant/apply')
)

export const resolvePostLoginDestination = (redirect, role) => {
  const safeRedirect = resolveRedirect(redirect)
  if (typeof redirect === 'string' && safeRedirect === redirect) {
    const targetPath = redirect.split(/[?#]/, 1)[0]
    if (
      targetPath !== '/login'
      && targetPath !== '/register'
      && !isExternalPortalPath(targetPath)
    ) return safeRedirect
  }
  return defaultDestinationForRole(role)
}

const readAccessRules = (to) => {
  const records = to.matched?.length ? to.matched : [{ meta: to.meta || {} }]
  const metas = records.map((record) => record.meta || {})
  return {
    requiresAuth: metas.some((meta) => meta.requiresAuth === true),
    roleRules: metas
      .filter((meta) => Array.isArray(meta.roles))
      .map((meta) => meta.roles),
  }
}

const restoreIfNeeded = async (userStore) => {
  if (!userStore.isLoggedIn || userStore.sessionInitialized) return
  try {
    await userStore.restoreSession()
  } catch {
    // 401 is synchronized by the request interceptor. Transient failures keep the token.
  }
}

export const createRoleAwareGuard = (getUserStore) => async (to) => {
  const userStore = getUserStore()
  const isAuthRoute = AUTH_ROUTE_NAMES.has(to.name)
  const { requiresAuth, roleRules } = readAccessRules(to)
  const isProtected = requiresAuth || roleRules.length > 0

  if (isAuthRoute) {
    if (!userStore.isLoggedIn) return true
    await restoreIfNeeded(userStore)
    if (!userStore.isLoggedIn) return true
    return resolvePostLoginDestination(to.query?.redirect, userStore.role)
  }

  if (!isProtected) return true
  if (!userStore.isLoggedIn) {
    return {
      name: 'login',
      query: { redirect: resolveRedirect(to.fullPath) },
    }
  }

  await restoreIfNeeded(userStore)
  if (!userStore.isLoggedIn) {
    return {
      name: 'login',
      query: { redirect: resolveRedirect(to.fullPath) },
    }
  }

  if (roleRules.some((allowedRoles) => !allowedRoles.includes(userStore.role))) {
    return { name: 'forbidden' }
  }

  return true
}
