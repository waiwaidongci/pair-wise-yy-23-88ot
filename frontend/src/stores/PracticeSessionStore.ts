import { create } from "zustand";
import { listPracticeSession } from "../api/PracticeSession";
import type { PracticeSession } from "../types/PracticeSession";
import { StoreError } from "../utils/errors";
import { logEntity } from "../utils/logger";

interface PracticeSessionState {
  rows: PracticeSession[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  /** 会话落库后本地插入/更新，保证切页再回来进度立即可见。 */
  upsert: (session: PracticeSession) => void;
}

export const usePracticeSessionStore = create<PracticeSessionState>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  loaded: false,
  async load(force = false) {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      set({ rows: await listPracticeSession(), loading: false, loaded: true });
    } catch (cause) {
      logEntity("PracticeSession", "finish", { score: 0, mistakeCount: 0, totalCount: 0 }, "error");
      set({ loading: false, error: new StoreError("STORAGE_UNAVAILABLE", cause).message });
    }
  },
  upsert(session) {
    const rest = get().rows.filter((row) => row.id !== session.id);
    set({ rows: [session, ...rest].sort((a, b) => b.started_at.localeCompare(a.started_at)) });
  }
}));
