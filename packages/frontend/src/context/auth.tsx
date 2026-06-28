import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import {
  login as apiLogin, register as apiRegister, logout as apiLogout,
  getStoredUser, forgotPassword, verifyResetToken, resetPassword,
  fetchCategories, saveGameConfig, fetchGameConfig,
  type UserPublic, type ApiCategory, type ApiTopic, type SavedGameConfig,
} from '../lib/api'

export interface AuthState {
  user: UserPublic | null
  isLoggedIn: boolean
  isAdmin: boolean
  categories: ApiCategory[]
  topics: ApiTopic[]
  lastConfig: SavedGameConfig | null
  login: (login: string, password: string) => Promise<UserPublic>
  register: (login: string, email: string, password: string) => Promise<UserPublic>
  logout: () => void
  forgotPw: (login: string, email: string) => Promise<void>
  resetPw: (token: string, password: string) => Promise<UserPublic>
  verifyToken: (token: string) => Promise<{ valid: boolean; login: string }>
  saveConfig: (config: SavedGameConfig) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(getStoredUser())
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [topics, setTopics] = useState<ApiTopic[]>([])
  const [lastConfig, setLastConfig] = useState<SavedGameConfig | null>(null)

  useEffect(() => {
    fetchCategories().then((cats) => {
      setCategories(cats)
      setTopics(cats.flatMap((c) => c.topics))
    })
  }, [])

  useEffect(() => {
    if (user && categories.length > 0) {
      fetchGameConfig().then(setLastConfig).catch(() => setLastConfig(null))
    }
  }, [user, categories])

  const handleLogin = useCallback(async (login: string, password: string) => {
    const r = await apiLogin(login, password)
    setUser(r.user)
    return r.user
  }, [])

  const handleRegister = useCallback(async (login: string, email: string, password: string) => {
    await apiRegister(login, email, password)
    const r = await apiLogin(login, password)
    setUser(r.user)
    return r.user
  }, [])

  const handleLogout = useCallback(() => {
    apiLogout()
    setUser(null)
  }, [])

  const handleForgotPw = useCallback(async (login: string, email: string) => {
    await forgotPassword(login, email)
  }, [])

  const handleResetPw = useCallback(async (token: string, password: string) => {
    const r = await resetPassword(token, password)
    setUser(r.user)
    return r.user
  }, [])

  const handleVerifyToken = useCallback(async (token: string) => {
    return verifyResetToken(token)
  }, [])

  const handleSaveConfig = useCallback((config: SavedGameConfig) => {
    setLastConfig(config)
    saveGameConfig(config).catch(() => {})
  }, [])

  const value: AuthState = {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.is_admin === 1,
    categories,
    topics,
    lastConfig,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    forgotPw: handleForgotPw,
    resetPw: handleResetPw,
    verifyToken: handleVerifyToken,
    saveConfig: handleSaveConfig,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
