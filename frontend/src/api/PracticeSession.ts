import { bulkPut, getAll, put } from "./database";
import type { PracticeSession, PracticeSessionInput } from "../types/PracticeSession";
import type { AnswerRecord, AnswerRecordInput } from "../types/AnswerRecord";
import { ServiceError } from "../utils/errors";
import { logEntity } from "../utils/logger";

export async function listPracticeSession(): Promise<PracticeSession[]> {
  try {
    const rows = await getAll<PracticeSession>("practiceSession");
    return rows.sort((a, b) => b.started_at.localeCompare(a.started_at));
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}

export async function createPracticeSession(payload: PracticeSessionInput): Promise<PracticeSession> {
  try {
    const saved = await put<PracticeSession>("practiceSession", payload as PracticeSession);
    logEntity("PracticeSession", "create", {
      id: saved.id,
      lessonId: saved.lesson_id,
      mode: saved.mode
    });
    return saved;
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}

export async function finishPracticeSession(payload: PracticeSession): Promise<PracticeSession> {
  try {
    const saved = await put<PracticeSession>("practiceSession", payload);
    logEntity("PracticeSession", "finish", {
      id: saved.id,
      score: saved.score,
      mistakeCount: saved.mistake_count,
      totalCount: saved.total_count
    });
    return saved;
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}

export async function savePracticeSession(payload: PracticeSession): Promise<PracticeSession> {
  return finishPracticeSession(payload);
}

/** 会话与该会话产生的答题记录一次性落库。 */
export async function persistSessionWithAnswers(
  session: PracticeSession,
  records: AnswerRecordInput[]
): Promise<{ session: PracticeSession; records: AnswerRecord[] }> {
  const savedSession = await finishPracticeSession(session);
  const rows = records.map((record) => ({ ...record, session_id: savedSession.id }));
  const savedRows = await bulkPut<AnswerRecordInput>("answerRecord", rows);
  savedRows.forEach((row) =>
    logEntity("AnswerRecord", "create", {
      id: row.id,
      symbolId: row.symbol_id,
      result: row.correct ? "正确" : "错误",
      latencyMs: row.latency_ms
    })
  );
  return { session: savedSession, records: savedRows as AnswerRecord[] };
}
