import type { PracticeSession } from "../types/PracticeSession";
import type { PracticeMode } from "../constants/PracticeMode";

export const createDefaultPracticeSession = (overrides: Partial<PracticeSession> = {}): PracticeSession => ({
  id: 0,
  lesson_id: 0,
  mode: "CELL_TO_TEXT",
  started_at: "",
  finished_at: "",
  score: 0,
  mistake_count: 0,
  ...overrides
});

export const createPracticeSessionForm = createDefaultPracticeSession;
export const createPracticeSessionResponse = createDefaultPracticeSession;

// 开始一次练习时构造会话草稿
export const createStartedPracticeSession = (
  id: number,
  lessonId: number,
  mode: PracticeMode,
  startedAt: string
): PracticeSession =>
  createDefaultPracticeSession({
    id,
    lesson_id: lessonId,
    mode,
    started_at: startedAt,
    finished_at: ""
  });
