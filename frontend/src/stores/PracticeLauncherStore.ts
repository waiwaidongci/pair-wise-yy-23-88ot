import { create } from "zustand";
import type { PracticeMode } from "../constants/PracticeMode";

/**
 * 练习发起器：练习页 / 错题本 / 学习卡片跨页发起一次练习时的临时载体。
 * 仅保存在内存，不做持久化（练习结果由会话与答题记录持久化）。
 */
export interface PracticeLaunch {
  /** 每次发起自增，作为练习页重置题组的 key。 */
  nonce: number;
  lessonId: number;
  mode: PracticeMode;
  /** 错题复习时指定的题源字符 id；存在时忽略课程字符集。 */
  symbolIds: number[] | null;
  /** 错题复习限定的错误原因（仅用于标题展示）。 */
  reasonLabel: string | null;
}

interface PracticeLauncherState extends PracticeLaunch {
  /** 跨页发起标记：练习页挂载时消费，避免离开后再回来误续旧会话。 */
  pending: boolean;
  launchLesson: (params: { lessonId: number; mode: PracticeMode }) => void;
  launchReview: (params: { symbolIds: number[]; mode: PracticeMode; reasonLabel?: string }) => void;
  /** 练习页已接管本次发起。 */
  consumePending: () => void;
  clear: () => void;
}

const initial: PracticeLaunch = {
  nonce: 0,
  lessonId: 1,
  mode: "CELL_TO_TEXT",
  symbolIds: null,
  reasonLabel: null
};

export const usePracticeLauncherStore = create<PracticeLauncherState>((set) => ({
  ...initial,
  pending: false,
  launchLesson({ lessonId, mode }) {
    set((state) => ({
      nonce: state.nonce + 1,
      lessonId: lessonId,
      mode,
      symbolIds: null,
      reasonLabel: null,
      pending: true
    }));
  },
  launchReview({ symbolIds, mode, reasonLabel }) {
    set((state) => ({
      nonce: state.nonce + 1,
      lessonId: 0,
      mode,
      symbolIds,
      reasonLabel: reasonLabel ?? null,
      pending: true
    }));
  },
  consumePending() {
    set({ pending: false });
  },
  clear() {
    set({ ...initial, pending: false });
  }
}));
