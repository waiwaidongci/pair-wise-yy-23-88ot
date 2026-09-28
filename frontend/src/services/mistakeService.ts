import { resolveAnswerRecord } from "../api/AnswerRecord";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { MistakeReason } from "../constants/MistakeReason";
import { ServiceError } from "../utils/errors";

export type MistakeFilter = MistakeReason | "ALL";

/** 错题本视图行：答题记录联表点字字符。 */
export interface MistakeRow {
  record: AnswerRecord;
  symbol: BrailleSymbol | undefined;
}

/** 错题本只展示未消化的错题，并可按错误原因筛选。 */
export function selectMistakeRows(
  records: AnswerRecord[],
  symbols: BrailleSymbol[],
  reason: MistakeFilter
): MistakeRow[] {
  const symbolMap = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  return records
    .filter((record) => !record.correct && !record.resolved)
    .filter((record) => reason === "ALL" || record.mistake_reason === reason)
    .map((record) => ({ record, symbol: symbolMap.get(record.symbol_id) }));
}

/** 取错题去重后的字符集合，作为"重新练习"的题源。 */
export function selectMistakeSymbols(rows: MistakeRow[]): BrailleSymbol[] {
  const map = new Map<number, BrailleSymbol>();
  rows.forEach(({ symbol }) => {
    if (symbol) map.set(symbol.id, symbol);
  });
  return Array.from(map.values());
}

/** 复习时重新答对：把该字符最早一条未消化的错题标记为已掌握。 */
export async function markMistakeResolved(
  records: AnswerRecord[],
  symbolId: number
): Promise<AnswerRecord | null> {
  const target = records.find(
    (record) => !record.correct && !record.resolved && record.symbol_id === symbolId
  );
  if (!target) return null;
  try {
    return await resolveAnswerRecord(target);
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("ANSWER_REJECTED", cause);
  }
}
