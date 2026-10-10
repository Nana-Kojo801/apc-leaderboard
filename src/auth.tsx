import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from './lib/api'

// The auth cookie is HttpOnly and the server has no "who am I" endpoint, so we
// remember the signed-in email locally and drop it as soon as the server says 401.
const STORAGE_KEY = 'apc.session.email'

interface AuthState {
  email: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Call with any error from an admin request; clears the session on 401. */
  handleAuthError: (err: unknown) => void
}

const AuthContext = createContext<AuthState | null>(null)

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(email: string | null) {
  try {
    if (email) localStorage.setItem(STORAGE_KEY, email)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable — session simply won't survive a reload */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(readStored)

  const login = useCallback(async (userEmail: string, password: string) => {
    await api.login(userEmail, password)
    writeStored(userEmail)
    setEmail(userEmail)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      writeStored(null)
      setEmail(null)
    }
  }, [])

  const handleAuthError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      writeStored(null)
      setEmail(null)
    }
  }, [])

  const value = useMemo(
    () => ({ email, login, logout, handleAuthError }),
    [email, login, logout, handleAuthError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
