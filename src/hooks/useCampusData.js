import { useCallback, useEffect, useMemo, useState } from 'react';
import { participationService, store } from '../services/api';

const todayISO = () => new Date().toISOString().slice(0, 10);

const sumHours = (records) => records.reduce((total, record) => total + Number(record.hoursLogged || 0), 0);

const countPending = () => participationService.getAllRecords().filter((record) => record.status === 'pending').length;

/**
 * Outstanding review count for navigation.
 *
 * Subscribes to the store-change event so a decision made anywhere in the app
 * is reflected in the navigation immediately, instead of waiting for a route
 * change to recompute it.
 */
export function usePendingCount(enabled) {
  const [count, setCount] = useState(countPending);

  useEffect(() => {
    if (!enabled) return undefined;
    const update = () => setCount(countPending());
    window.addEventListener('campus:records-changed', update);
    return () => window.removeEventListener('campus:records-changed', update);
  }, [enabled]);

  return enabled ? count : 0;
}

/** Latest activity definitions, keyed by id, for joining records to their event. */
export function useActivityIndex() {
  return useMemo(() => {
    const index = new Map();
    store.read('campus_activities', []).forEach((item) => index.set(item.id, item));
    return index;
  }, []);
}

export function useUpcomingActivities(limit) {
  return useMemo(() => {
    const today = todayISO();
    const items = store
      .read('campus_activities', [])
      .filter((item) => item.status === 'open' && item.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return typeof limit === 'number' ? items.slice(0, limit) : items;
  }, [limit]);
}

export function useAllActivities() {
  return useMemo(() => store.read('campus_activities', []).slice().sort((a, b) => a.date.localeCompare(b.date)), []);
}

/** The student's real contribution figures — approved and pending kept apart. */
export function useStudentService(user) {
  return useMemo(() => {
    const records = participationService.getRecordsForUser(user);
    const approved = records.filter((record) => record.status === 'approved');
    const pending = records.filter((record) => record.status === 'pending');
    return {
      records,
      approvedCount: approved.length,
      approvedHours: sumHours(approved),
      pendingCount: pending.length,
      pendingHours: sumHours(pending),
    };
  }, [user]);
}

/** Admin review queue with per-row busy state, driven by the service layer. */
export function useAdminQueue(notify) {
  const [records, setRecords] = useState(() => participationService.getAllRecords());
  const [busyId, setBusyId] = useState('');

  const decide = useCallback(
    async (record, verdict) => {
      setBusyId(record.id);
      try {
        if (verdict === 'approved') await participationService.approveHours(record.id);
        else await participationService.rejectHours(record.id);
        setRecords(participationService.getAllRecords());
        window.dispatchEvent(new Event('campus:records-changed'));
        notify(
          verdict === 'approved'
            ? `${record.studentName}'s hours were approved.`
            : `${record.studentName}'s submission was declined.`,
        );
      } finally {
        setBusyId('');
      }
    },
    [notify],
  );

  const pending = records.filter((record) => record.status === 'pending');
  return {
    pending,
    busyId,
    decide,
    approvedHours: sumHours(records.filter((record) => record.status === 'approved')),
    studentCount: new Set(records.map((record) => record.userId || record.studentId)).size,
  };
}
