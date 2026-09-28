import { getAll, put } from "./database";
import type { AnswerRecord } from "../types/AnswerRecord";
import { ServiceError } from "../utils/errors";
import { logEntity } from "../utils/logger";

export async function listAnswerRecord(): Promise<AnswerRecord[]> {
  try {
    const rows = await getAll<AnswerRecord>("answerRecord");
    return rows.sort((a, b) => b.id - a.id);
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}

export async function saveAnswerRecord(payload: AnswerRecord): Promise<AnswerRecord> {
  try {
    const saved = await put<AnswerRecord>("answerRecord", payload);
    logEntity("AnswerRecord", "create", {
      id: saved.id,
      symbolId: saved.symbol_id,
      result: saved.correct ? "正确" : "错误",
      latencyMs: saved.latency_ms
    });
    return saved;
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}

/** 错题被重新答对后标记为已消化（错题本不再展示）。 */
export async function resolveAnswerRecord(payload: AnswerRecord): Promise<AnswerRecord> {
  try {
    const saved = await put<AnswerRecord>("answerRecord", { ...payload, resolved: true });
    logEntity("AnswerRecord", "resolve", { id: saved.id });
    return saved;
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}
