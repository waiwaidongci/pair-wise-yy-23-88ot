import { create } from "zustand";
import { createPracticeSession, listPracticeSession, updatePracticeSession } from "../api/PracticeSession";
import type { PracticeSession } from "../types/PracticeSession";

type State = {
  rows: PracticeSession[];
  loading: boolean;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  add: (session: PracticeSession) => Promise<PracticeSession>;
  finish: (session: PracticeSession) => Promise<PracticeSession>;
};

export const usePracticeSessionStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  loaded: false,
  async load(force = false) {
    if (get().loaded && !force) return;
    set({ loading: true });
    try {
      const rows = await listPracticeSession();
      set({ rows: rows.sort((a, b) => a.started_at.localeCompare(b.started_at)), loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  async add(session) {
    const saved = await createPracticeSession(session);
    set({ rows: [...get().rows, saved].sort((a, b) => a.started_at.localeCompare(b.started_at)) });
    return saved;
  },
  async finish(session) {
    const saved = await updatePracticeSession(session);
    set({
      rows: get()
        .rows.map((row) => (row.id === saved.id ? saved : row))
        .sort((a, b) => a.started_at.localeCompare(b.started_at))
    });
    return saved;
  }
}));
