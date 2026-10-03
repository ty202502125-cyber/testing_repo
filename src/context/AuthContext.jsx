import { useMemo, useState } from 'react';
import { authService, store } from '../services/api';
import { AuthContext } from './authHooks';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => store.read('campus_session', null));

  const value = useMemo(
    () => ({
      user,
      login: async (email, password) => {
        const result = await authService.login(email, password);
        setUser(result);
        return result;
      },
      register: async (data) => {
        const result = await authService.register(data);
        setUser(result);
        return result;
      },
      logout: () => {
        authService.logout();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
