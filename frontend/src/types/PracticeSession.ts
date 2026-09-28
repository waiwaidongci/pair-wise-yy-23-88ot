import type { PracticeMode } from "../constants/PracticeMode";

export interface PracticeSession {
  id: number;
  lesson_id: number;
  mode: PracticeMode;
  started_at: string;
  finished_at: string;
  /** 0-100 分 */
  score: number;
  mistake_count: number;
}
