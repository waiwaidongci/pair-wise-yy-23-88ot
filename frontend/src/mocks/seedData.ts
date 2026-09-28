import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { Lesson } from "../types/Lesson";
import { toSeedBrailleSymbols, SEED_LESSONS } from "./brailleTable";

/**
 * 本地 mock 种子数据。首次打开应用时由 IndexedDB 数据层写入本机，
 * 之后所有读写都走 IndexedDB；本文件仅负责首次播种与导出兜底。
 */
const brailleSymbol: BrailleSymbol[] = toSeedBrailleSymbols();
const lesson: Lesson[] = SEED_LESSONS.map(({ id, title, symbol_ids, stage, estimated_minutes, unlock_rule }) => ({
  id,
  title,
  symbol_ids,
  stage,
  estimated_minutes,
  unlock_rule
}));

export const mockData = {
  brailleSymbol,
  lesson,
  practiceSession: [] as Array<Record<string, never>>,
  answerRecord: [] as Array<Record<string, never>>
};
