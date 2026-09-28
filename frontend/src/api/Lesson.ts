import { idbGetAll, idbPut } from "./db";
import type { Lesson } from "../types/Lesson";
import { logWrite } from "../utils/logger";
import { LocalDataError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";

export async function listLesson(): Promise<Lesson[]> {
  try {
    return await idbGetAll<Lesson>("lesson");
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}

export async function saveLesson(payload: Lesson): Promise<Lesson> {
  try {
    await idbPut("lesson", payload);
    logWrite("Lesson", payload.id ? "UPDATE" : "CREATE", { id: payload.id, title: payload.title });
    return payload;
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}
