import { create } from "zustand";
import { listLesson } from "../api/Lesson";
import type { Lesson } from "../types/Lesson";

type State = {
  rows: Lesson[];
  loading: boolean;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  getById: (id: number) => Lesson | undefined;
};

export const useLessonStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  loaded: false,
  async load(force = false) {
    if (get().loaded && !force) return;
    set({ loading: true });
    try {
      set({ rows: await listLesson(), loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  getById(id) {
    return get().rows.find((row) => row.id === id);
  }
}));
