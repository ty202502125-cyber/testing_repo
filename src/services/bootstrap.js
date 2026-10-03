import { store } from './api';
import { seedActivities, seedRecords, seedUsers } from './mockData';

/**
 * Seeds the local store before the first render so every screen — including the
 * signed-out pages — reads real data instead of empty fallbacks.
 */
export function ensureSeedData() {
  if (!localStorage.getItem('campus_users')) store.write('campus_users', seedUsers);
  if (!localStorage.getItem('campus_activities')) store.write('campus_activities', seedActivities);
  if (!localStorage.getItem('campus_records')) store.write('campus_records', seedRecords);
  if (!localStorage.getItem('campus_signups')) store.write('campus_signups', [{ activityId: 'a2', studentId: 'u1' }]);
}
