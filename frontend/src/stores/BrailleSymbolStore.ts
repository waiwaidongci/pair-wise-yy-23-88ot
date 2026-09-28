import { create } from "zustand";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import type { BrailleSymbol } from "../types/BrailleSymbol";

type State = {
  rows: BrailleSymbol[];
  loading: boolean;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  getById: (id: number) => BrailleSymbol | undefined;
};

export const useBrailleSymbolStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  loaded: false,
  async load(force = false) {
    if (get().loaded && !force) return;
    set({ loading: true });
    try {
      set({ rows: await listBrailleSymbol(), loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  getById(id) {
    return get().rows.find((row) => row.id === id);
  }
}));
