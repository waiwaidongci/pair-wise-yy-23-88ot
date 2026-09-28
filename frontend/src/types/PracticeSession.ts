import type { PracticeMode } from "../constants/PracticeMode";

export interface PracticeSession {
  id: number;
  /** 0 表示来自错题本的复习会话，不属于任何课程。 */
  lesson_id: number;
  mode: PracticeMode;
  started_at: string;
  finished_at: string;
  /** 0-100，本次会话正确率折算得分。 */
  score: number;
  mistake_count: number;
  total_count: number;
}

/** 创建会话时 id 由本地 IndexedDB 自动生成。 */
export type PracticeSessionInput = Omit<PracticeSession, "id">;
