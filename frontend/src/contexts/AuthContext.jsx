import { createContext, useState, useEffect, useCallback } from 'react'
import authService from '../services/auth.service'

export const AuthContext = createContext(null)

const STORAGE_KEYS = {
  token: 'accessToken',
  refresh: 'refreshToken',
  user: 'user',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null')
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.token)
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const data = await authService.me()
        setUser(data.data)
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.data))
      } catch {
        localStorage.removeItem(STORAGE_KEYS.token)
        localStorage.removeItem(STORAGE_KEYS.refresh)
        localStorage.removeItem(STORAGE_KEYS.user)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await authService.login({ username, password })
    localStorage.setItem(STORAGE_KEYS.token, data.data.accessToken)
    localStorage.setItem(STORAGE_KEYS.refresh, data.data.refreshToken)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.data.user))
    setUser(data.data.user)
    return data.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // bỏ qua lỗi khi logout
    }
    localStorage.removeItem(STORAGE_KEYS.token)
    localStorage.removeItem(STORAGE_KEYS.refresh)
    localStorage.removeItem(STORAGE_KEYS.user)
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false
      return roles.includes(user.role)
    },
    [user]
  )

  const value = { user, setUser, loading, login, logout, hasRole }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}