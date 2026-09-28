import { create } from "zustand";
import type { MistakeReason } from "../constants/MistakeReason";

interface MistakeRehearsalState {
  pendingSymbolIds: number[];
  sourceReason: MistakeReason | "ALL";
  request: (symbolIds: number[], reason: MistakeReason | "ALL") => void;
  clear: () => void;
}

// 错题本 -> 练习页 的跨页参数通道（仅内存，练习记录仍落本机库）
export const useMistakeRehearsalStore = create<MistakeRehearsalState>((set) => ({
  pendingSymbolIds: [],
  sourceReason: "ALL",
  request(symbolIds, reason) {
    set({ pendingSymbolIds: symbolIds, sourceReason: reason });
  },
  clear() {
    set({ pendingSymbolIds: [], sourceReason: "ALL" });
  }
}));
