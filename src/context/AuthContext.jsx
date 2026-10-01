import { useEffect, useMemo, useState } from 'react';
import { authService, store } from '../services/api';
import { seedActivities, seedRecords, seedUsers } from '../services/mockData';
import { AuthContext } from './authHooks';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => store.read('campus_session', null));
  useEffect(() => {
    if (!localStorage.getItem('campus_users')) store.write('campus_users', seedUsers);
    if (!localStorage.getItem('campus_activities')) store.write('campus_activities', seedActivities);
    if (!localStorage.getItem('campus_records')) store.write('campus_records', seedRecords);
    if (!localStorage.getItem('campus_signups')) store.write('campus_signups', [{ activityId: 'a2', studentId: 'u1' }]);
  }, []);
  const value = useMemo(() => ({ user, login: async (email, password) => { const result = await authService.login(email, password); setUser(result); return result; }, register: async (data) => { const result = await authService.register(data); setUser(result); return result; }, logout: () => { authService.logout(); setUser(null); } }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
