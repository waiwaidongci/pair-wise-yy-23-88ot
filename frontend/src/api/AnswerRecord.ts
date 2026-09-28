import { idbDelete, idbGetAll, idbPut, idbPutMany } from "./db";
import type { AnswerRecord } from "../types/AnswerRecord";
import { logWrite } from "../utils/logger";
import { LocalDataError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";

export async function listAnswerRecord(): Promise<AnswerRecord[]> {
  try {
    return await idbGetAll<AnswerRecord>("answerRecord");
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}

export async function createAnswerRecord(payload: AnswerRecord): Promise<AnswerRecord> {
  try {
    await idbPut("answerRecord", payload);
    logWrite("AnswerRecord", "CREATE", {
      id: payload.id,
      sessionId: payload.session_id,
      correct: payload.correct
    });
    return payload;
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}

export async function createAnswerRecords(payload: AnswerRecord[]): Promise<AnswerRecord[]> {
  try {
    await idbPutMany("answerRecord", payload);
    logWrite("AnswerRecord", "CREATE", {
      id: payload.map((row) => row.id).join(","),
      sessionId: payload[0]?.session_id ?? "",
      correct: payload.length
    });
    return payload;
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}

export async function updateAnswerRecord(payload: AnswerRecord): Promise<AnswerRecord> {
  try {
    await idbPut("answerRecord", payload);
    logWrite("AnswerRecord", "STATUS_CHANGE", { id: payload.id, mastered: payload.correct });
    return payload;
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}

export async function updateAnswerRecords(payload: AnswerRecord[]): Promise<AnswerRecord[]> {
  try {
    await idbPutMany("answerRecord", payload);
    logWrite("AnswerRecord", "RESOLVE", { ids: payload.map((row) => row.id).join(",") });
    return payload;
  } catch (an) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(an));
  }
}

export async function deleteAnswerRecord(id: number): Promise<void> {
  try {
    await idbDelete("answerRecord", id);
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}
