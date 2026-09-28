import { getAll, put } from "./database";
import type { Lesson } from "../types/Lesson";
import { ServiceError } from "../utils/errors";
import { logEntity } from "../utils/logger";

export async function listLesson(): Promise<Lesson[]> {
  try {
    const rows = await getAll<Lesson>("lesson");
    return rows.sort((a, b) => a.id - b.id);
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}

export async function saveLesson(payload: Lesson): Promise<Lesson> {
  try {
    const saved = await put<Lesson>("lesson", payload);
    logEntity("Lesson", payload.id ? "update" : "create", {
      id: saved.id,
      title: saved.title,
      stage: saved.stage,
      symbolCount: saved.symbol_ids.length,
      fields: "title/symbol_ids/stage/estimated_minutes/unlock_rule"
    });
    return saved;
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}
