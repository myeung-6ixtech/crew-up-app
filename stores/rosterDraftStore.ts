import { create } from 'zustand';
import type { ParsedRosterEntry, ParsedRosterTrip } from '@/types/domain';

interface RosterDraftState {
  sourceFileId?: string;
  /** Layovers typed in by hand (no file). */
  entries: ParsedRosterEntry[];
  /** Pairings read from an uploaded roster. */
  trips: ParsedRosterTrip[];
  /** Roster days the parser left out (off, standby, training). */
  skippedDuties: number;
  setDraft: (sourceFileId: string | undefined, entries: ParsedRosterEntry[], trips?: ParsedRosterTrip[], skippedDuties?: number) => void;
  updateEntry: (index: number, entry: ParsedRosterEntry) => void;
  removeEntry: (index: number) => void;
  addEntry: (entry: ParsedRosterEntry) => void;
  updateTripLayover: (tripIndex: number, layoverIndex: number, entry: ParsedRosterEntry) => void;
  removeTrip: (tripIndex: number) => void;
  clear: () => void;
}

export const useRosterDraftStore = create<RosterDraftState>((set) => ({
  sourceFileId: undefined,
  entries: [],
  trips: [],
  skippedDuties: 0,
  setDraft: (sourceFileId, entries, trips = [], skippedDuties = 0) => set({ sourceFileId, entries, trips, skippedDuties }),
  updateEntry: (index, entry) =>
    set((state) => ({
      entries: state.entries.map((e, i) => (i === index ? entry : e)),
    })),
  removeEntry: (index) =>
    set((state) => ({ entries: state.entries.filter((_, i) => i !== index) })),
  addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),
  updateTripLayover: (tripIndex, layoverIndex, entry) =>
    set((state) => ({
      trips: state.trips.map((trip, i) =>
        i === tripIndex
          ? { ...trip, layovers: trip.layovers.map((layover, j) => (j === layoverIndex ? entry : layover)) }
          : trip,
      ),
    })),
  removeTrip: (tripIndex) => set((state) => ({ trips: state.trips.filter((_, i) => i !== tripIndex) })),
  clear: () => set({ sourceFileId: undefined, entries: [], trips: [], skippedDuties: 0 }),
}));
