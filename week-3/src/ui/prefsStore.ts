import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TableDensity = 'comfortable' | 'compact';

interface PrefsState {
  tableDensity: TableDensity;
  setTableDensity: (density: TableDensity) => void;
}

// UI preferences are harmless to keep in localStorage, unlike the access token.
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      tableDensity: 'comfortable',
      setTableDensity: (tableDensity) => {
        set({ tableDensity });
      },
    }),
    { name: 'slow-pour-admin:prefs' },
  ),
);
