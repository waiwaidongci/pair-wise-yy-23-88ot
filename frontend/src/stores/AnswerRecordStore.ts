import { create } from "zustand";
import { listAnswerRecord } from "../api/AnswerRecord";
import type { AnswerRecord } from "../types/AnswerRecord";
import { StoreError } from "../utils/errors";
import { logEntity } from "../utils/logger";

interface AnswerRecordState {
  rows: AnswerRecord[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  appendMany: (records: AnswerRecord[]) => void;
  replace: (record: AnswerRecord) => void;
}

export const useAnswerRecordStore = create<AnswerRecordState>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  loaded: false,
  async load(force = false) {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      set({ rows: await listAnswerRecord(), loading: false, loaded: true });
    } catch (cause) {
      logEntity("AnswerRecord", "create", { id: 0, symbolId: 0, result: "错误", latencyMs: 0 }, "error");
      set({ loading: false, error: new StoreError("STORAGE_UNAVAILABLE", cause).message });
    }
  },
  appendMany(records) {
    set({ rows: [...records].sort((a, b) => b.id - a.id).concat(get().rows) });
  },
  replace(record) {
    set({ rows: get().rows.map((row) => (row.id === record.id ? record : row)) });
  }
}));
