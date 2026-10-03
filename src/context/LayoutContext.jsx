import { useCallback, useEffect, useMemo, useState } from 'react';
import { layoutIds, defaultLayoutId } from '../layouts/registry';
import { LayoutContext } from './layoutHooks';

const STORAGE_KEY = 'campus_layout';

const readStoredLayout = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return layoutIds.includes(stored) ? stored : defaultLayoutId;
  } catch {
    return defaultLayoutId;
  }
};

/**
 * Workspace layout preference.
 *
 * The three directions are alternative presentations of the same data, so the
 * choice is a persisted preference rather than separate routes.
 */
export function LayoutProvider({ children }) {
  const [layoutId, setLayoutId] = useState(readStoredLayout);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, layoutId);
  }, [layoutId]);

  const setLayout = useCallback((next) => {
    if (layoutIds.includes(next)) setLayoutId(next);
  }, []);

  const value = useMemo(() => ({ layoutId, setLayout }), [layoutId, setLayout]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}
