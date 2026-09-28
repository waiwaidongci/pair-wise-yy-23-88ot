import { idbGetAll, idbPut } from "./db";
import type { PracticeSession } from "../types/PracticeSession";
import { logWrite } from "../utils/logger";
import { LocalDataError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";

export async function listPracticeSession(): Promise<PracticeSession[]> {
  try {
    return await idbGetAll<PracticeSession>("practiceSession");
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}

export async function createPracticeSession(payload: PracticeSession): Promise<PracticeSession> {
  try {
    await idbPut("practiceSession", payload);
    logWrite("PracticeSession", "CREATE", {
      id: payload.id,
      lessonId: payload.lesson_id,
      mode: payload.mode
    });
    return payload;
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}

export async function updatePracticeSession(payload: PracticeSession): Promise<PracticeSession> {
  try {
    await idbPut("practiceSession", payload);
    logWrite("PracticeSession", "FINISH", {
      id: payload.id,
      score: payload.score,
      mistakes: payload.mistake_count
    });
    return payload;
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}
