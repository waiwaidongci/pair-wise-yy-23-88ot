import { create } from "zustand";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import { StoreError } from "../utils/errors";
import { logEntity } from "../utils/logger";

interface BrailleSymbolState {
  rows: BrailleSymbol[];
  loading: boolean;
  error: string | null;
  /** 首次播种后由引导 hook 调用，之后页面切换不重复读库。 */
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
}

export const useBrailleSymbolStore = create<BrailleSymbolState>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  loaded: false,
  async load(force = false) {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      set({ rows: await listBrailleSymbol(), loading: false, loaded: true });
    } catch (cause) {
      logEntity("BrailleSymbol", "update", { fields: "load-failed" }, "error");
      set({ loading: false, error: new StoreError("STORAGE_UNAVAILABLE", cause).message });
    }
  }
}));
