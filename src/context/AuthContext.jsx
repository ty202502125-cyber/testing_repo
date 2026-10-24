import { useMemo, useState } from 'react'
import { authService, store } from '../services/api'
import { AuthContext } from './authHooks'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => store.read('campus_session', null))

  const authValue = useMemo(
    () => ({
      user,
      login: async (email, password) => {
        const loggedInUser = await authService.login(email, password)
        setUser(loggedInUser)
        return loggedInUser
      },
      register: async (userData) => {
        const newUser = await authService.register(userData)
        setUser(newUser)
        return newUser
      },
      logout: () => {
        authService.logout()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
}
