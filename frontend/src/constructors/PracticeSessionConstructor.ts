import type { PracticeSession, PracticeSessionInput } from "../types/PracticeSession";
import type { PracticeMode } from "../types/PracticeMode";

export const createDefaultPracticeSession = (overrides: Partial<PracticeSession> = {}): PracticeSession => ({
  id: 0,
  lesson_id: 0,
  mode: "CELL_TO_TEXT",
  started_at: "",
  finished_at: "",
  score: 0,
  mistake_count: 0,
  total_count: 0,
  ...overrides
});

/**
 * 开始一次练习时的会话表单对象：id 由 IndexedDB 分配，
 * finished_at/score 等待提交时回填。
 */
export const createPracticeSessionForm = (
  lessonId: number,
  mode: PracticeMode,
  startedAt = new Date().toISOString()
): PracticeSessionInput => ({
  lesson_id: lessonId,
  mode,
  started_at: startedAt,
  finished_at: "",
  score: 0,
  mistake_count: 0,
  total_count: 0
});

export const createPracticeSessionResponse = createDefaultPracticeSession;
