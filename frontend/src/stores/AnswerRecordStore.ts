import { create } from "zustand";
import {
  createAnswerRecords,
  listAnswerRecord,
  updateAnswerRecords
} from "../api/AnswerRecord";
import type { AnswerRecord } from "../types/AnswerRecord";

type State = {
  rows: AnswerRecord[];
  loading: boolean;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  addMany: (records: AnswerRecord[]) => Promise<AnswerRecord[]>;
  updateMany: (records: AnswerRecord[]) => Promise<AnswerRecord[]>;
};

export const useAnswerRecordStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  loaded: false,
  async load(force = false) {
    if (get().loaded && !force) return;
    set({ loading: true });
    try {
      const rows = await listAnswerRecord();
      set({ rows: rows.sort((a, b) => a.created_at.localeCompare(b.created_at)), loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  async addMany(records) {
    if (!records.length) return records;
    const saved = await createAnswerRecords(records);
    set({ rows: [...get().rows, ...saved].sort((a, b) => a.created_at.localeCompare(b.created_at)) });
    return saved;
  },
  async updateMany(records) {
    if (!records.length) return records;
    const saved = await updateAnswerRecords(records);
    const map = new Map(saved.map((row) => [row.id, row]));
    set({ rows: get().rows.map((row) => map.get(row.id) ?? row) });
    return saved;
  }
}));
