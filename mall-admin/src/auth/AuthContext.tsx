import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { adminApi } from '../api/admin'
import { getToken, setToken } from '../api/client'
import type { AdminUser } from '../api/types'

const USER_KEY = 'mall-admin-user'

interface AuthValue {
  user: AdminUser | null
  authenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) as AdminUser : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AdminUser | null>(() => getToken() ? readStoredUser() : null)

  const logout = () => {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  useEffect(() => {
    window.addEventListener('mall-admin:unauthorized', logout)
    return () => window.removeEventListener('mall-admin:unauthorized', logout)
  }, [])

  const login = async (username: string, password: string) => {
    const data = await adminApi.login(username, password)
    if (data.user.role !== 2) {
      throw new Error('该账号不是管理员，无法进入管理后台')
    }
    setToken(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setUser(data.user)
  }

  const value = useMemo<AuthValue>(() => ({
    user,
    authenticated: Boolean(user && getToken()),
    login,
    logout,
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
