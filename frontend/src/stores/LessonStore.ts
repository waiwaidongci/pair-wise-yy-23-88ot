import { create } from "zustand";
import { listLesson } from "../api/Lesson";
import type { Lesson } from "../types/Lesson";
import { StoreError } from "../utils/errors";
import { logEntity } from "../utils/logger";

interface LessonState {
  rows: Lesson[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  loaded: false,
  async load(force = false) {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      set({ rows: await listLesson(), loading: false, loaded: true });
    } catch (cause) {
      logEntity("Lesson", "update", { fields: "load-failed" }, "error");
      set({ loading: false, error: new StoreError("STORAGE_UNAVAILABLE", cause).message });
    }
  }
}));
