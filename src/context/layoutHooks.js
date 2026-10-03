import { createContext, useContext } from 'react';

export const LayoutContext = createContext(null);

export function useLayout() {
  const value = useContext(LayoutContext);
  if (!value) throw new Error('useLayout must be used inside a LayoutProvider');
  return value;
}
