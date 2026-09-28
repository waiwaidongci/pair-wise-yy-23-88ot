import { bulkPut, count, getAll, type StoreName } from "./database";
import { mockData } from "../mocks/seedData";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { Lesson } from "../types/Lesson";
import { ServiceError } from "../utils/errors";
import { logEntity } from "../utils/logger";

/**
 * 播种服务：首次打开（或本机库为空）时把课程与点字字符写入 IndexedDB。
 * 练习会话与答题记录不从种子灌入，保证进度页初始为空状态。
 */
export async function ensureSeeded(): Promise<void> {
  try {
    const [symbolCount, lessonCount] = await Promise.all([
      count("brailleSymbol"),
      count("lesson")
    ]);
    if (symbolCount === 0) {
      await bulkPut("brailleSymbol", mockData.brailleSymbol);
      logEntity("BrailleSymbol", "seed", { count: mockData.brailleSymbol.length });
    }
    if (lessonCount === 0) {
      await bulkPut("lesson", mockData.lesson);
      logEntity("Lesson", "seed", { count: mockData.lesson.length });
    }
  } catch (cause) {
    if (cause instanceof ServiceError) throw cause;
    throw new ServiceError("SEED_FAILED", cause);
  }
}

/** 导出本机全部数据（业务动作：导入导出），按实体分文件封装在这里聚合。 */
export async function exportLocalData(): Promise<{
  brailleSymbol: BrailleSymbol[];
  lesson: Lesson[];
  practiceSession: unknown[];
  answerRecord: unknown[];
}> {
  const names: StoreName[] = ["brailleSymbol", "lesson", "practiceSession", "answerRecord"];
  const [brailleSymbol, lesson, practiceSession, answerRecord] = (await Promise.all(
    names.map((name) => getAll(name))
  )) as [BrailleSymbol[], Lesson[], unknown[], unknown[]];
  logEntity("PracticeSession", "export", { count: practiceSession.length });
  logEntity("AnswerRecord", "export", { count: answerRecord.length });
  return { brailleSymbol, lesson, practiceSession, answerRecord };
}
