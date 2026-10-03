import { useCallback, useEffect, useMemo, useState } from 'react'
import { loginRequest, meRequest, registerRequest } from '../api/auth'
import { tokenStorage } from '../api/http'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Solo hay que esperar la verificacion si quedo un token guardado
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()))

  // Al recargar la pagina se valida el token guardado contra el backend
  useEffect(() => {
    if (!tokenStorage.get()) return
    meRequest()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false))
  }, [])

  const startSession = ({ token, usuario }) => {
    tokenStorage.set(token)
    setUser(usuario)
  }

  const login = useCallback(async (credentials) => startSession(await loginRequest(credentials)), [])
  const register = useCallback(async (data) => startSession(await registerRequest(data)), [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAuth: Boolean(user), loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
