import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

/** Device flag so house rules show once per account, before step 1. Not a server step. */
function storageKey(userId: string) {
  return `crewup.houseRulesAccepted.${userId}`;
}

type HouseRulesStatus = 'unknown' | 'required' | 'accepted';

type HouseRulesStore = {
  userId: string | null;
  status: HouseRulesStatus;
  load: (userId: string) => Promise<void>;
  accept: (userId: string) => Promise<void>;
  reset: () => void;
};

export const useHouseRulesStore = create<HouseRulesStore>((set, get) => ({
  userId: null,
  status: 'unknown',
  load: async (userId) => {
    const current = get();
    if (current.userId === userId && current.status !== 'unknown') return;
    set({ userId, status: 'unknown' });
    const value = await SecureStore.getItemAsync(storageKey(userId));
    if (get().userId !== userId || get().status === 'accepted') return;
    set({ status: value === '1' ? 'accepted' : 'required' });
  },
  accept: async (userId) => {
    await SecureStore.setItemAsync(storageKey(userId), '1');
    set({ userId, status: 'accepted' });
  },
  reset: () => set({ userId: null, status: 'unknown' }),
}));
