import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const SAFETY_NUDGE_KEY = 'safetyNudgeSeen';

interface SafetyStore {
  nudgeVisible: boolean;
  checkNudge: () => Promise<void>;
  dismissNudge: () => Promise<void>;
}

export const useSafetyStore = create<SafetyStore>((set) => ({
  nudgeVisible: false,
  checkNudge: async () => {
    const seen = await SecureStore.getItemAsync(SAFETY_NUDGE_KEY);
    if (!seen) set({ nudgeVisible: true });
  },
  dismissNudge: async () => {
    await SecureStore.setItemAsync(SAFETY_NUDGE_KEY, '1');
    set({ nudgeVisible: false });
  },
}));
