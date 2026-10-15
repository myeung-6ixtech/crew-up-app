import { create } from 'zustand';

interface AuthDraftState {
  email: string;
  /**
   * Held in memory only, between Create account and verification, so "Verified on another device? Log in"
   * can sign in without asking again. Never persisted; cleared on sign-in.
   */
  password: string;
  /** An email sign up rejected as already registered; 4A shows it as taken. */
  takenEmail: string;
  setEmail: (email: string) => void;
  setCredentials: (email: string, password: string) => void;
  markTaken: (email: string) => void;
  clear: () => void;
}

export const useAuthDraftStore = create<AuthDraftState>((set) => ({
  email: '',
  password: '',
  takenEmail: '',
  setEmail: (email) => set({ email }),
  setCredentials: (email, password) => set({ email, password }),
  markTaken: (email) => set({ takenEmail: email.toLowerCase(), password: '' }),
  clear: () => set({ email: '', password: '', takenEmail: '' }),
}));
