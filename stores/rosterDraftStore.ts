import { create } from 'zustand';
import type { ParsedRosterEntry } from '@/types/domain';

interface RosterDraftState {
  sourceFileId?: string;
  entries: ParsedRosterEntry[];
  setDraft: (sourceFileId: string | undefined, entries: ParsedRosterEntry[]) => void;
  updateEntry: (index: number, entry: ParsedRosterEntry) => void;
  removeEntry: (index: number) => void;
  addEntry: (entry: ParsedRosterEntry) => void;
  clear: () => void;
}

export const useRosterDraftStore = create<RosterDraftState>((set) => ({
  sourceFileId: undefined,
  entries: [],
  setDraft: (sourceFileId, entries) => set({ sourceFileId, entries }),
  updateEntry: (index, entry) =>
    set((state) => ({
      entries: state.entries.map((e, i) => (i === index ? entry : e)),
    })),
  removeEntry: (index) =>
    set((state) => ({ entries: state.entries.filter((_, i) => i !== index) })),
  addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),
  clear: () => set({ sourceFileId: undefined, entries: [] }),
}));
