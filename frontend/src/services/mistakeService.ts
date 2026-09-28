import type { AnswerRecord } from "../types/AnswerRecord";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { MistakeReason } from "../constants/MistakeReason";
import { MistakeReasonText } from "../constants/MistakeReason";

export interface MistakeEntry {
  record: AnswerRecord;
  symbol: BrailleSymbol;
}

export interface MistakeFilter {
  reason: MistakeReason | "ALL";
  keyword: string;
}

// 错题本取“答错且未被标记掌握”的记录，按时间倒序
export function selectOpenMistakes(
  records: AnswerRecord[],
  symbols: BrailleSymbol[],
  filter: MistakeFilter = { reason: "ALL", keyword: "" }
): MistakeEntry[] {
  const symbolMap = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  const keyword = filter.keyword.trim().toLowerCase();
  return records
    .filter((record) => !record.correct && !record.resolved_at)
    .filter((record) => filter.reason === "ALL" || record.mistake_reason === filter.reason)
    .map((record) => ({ record, symbol: symbolMap.get(record.symbol_id) }))
    .filter((entry): entry is MistakeEntry => Boolean(entry.symbol))
    .filter((entry) => {
      if (!keyword) return true;
      return (
        entry.symbol.letter.toLowerCase().includes(keyword) ||
        entry.symbol.pinyin.toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => b.record.created_at.localeCompare(a.record.created_at));
}

// 错题本筛选用的原因列表，附每个原因的待处理数量
export function summarizeReasons(records: AnswerRecord[]): { reason: MistakeReason | "ALL"; label: string; count: number }[] {
  const open = records.filter((record) => !record.correct && !record.resolved_at);
  const counts = new Map<MistakeReason, number>();
  open.forEach((record) => {
    if (!record.mistake_reason) return;
    counts.set(record.mistake_reason, (counts.get(record.mistake_reason) ?? 0) + 1);
  });
  return [
    { reason: "ALL", label: "全部", count: open.length },
    ...(Object.keys(MistakeReasonText) as MistakeReason[]).map((reason) => ({
      reason,
      label: MistakeReasonText[reason],
      count: counts.get(reason) ?? 0
    }))
  ];
}

// 重新作答答对后，按 symbol 关闭该字符仍打开的错题记录
export function resolveMistakeRecords(
  records: AnswerRecord[],
  symbolIds: number[],
  resolvedAt: string
): AnswerRecord[] {
  const idSet = new Set(symbolIds);
  return records.map((record) =>
    !record.correct && !record.resolved_at && idSet.has(record.symbol_id)
      ? { ...record, resolved_at: resolvedAt }
      : record
  );
}

export function markRecordsResolved(records: AnswerRecord[], ids: number[], resolvedAt: string): AnswerRecord[] {
  const idSet = new Set(ids);
  return records.map((record) =>
    idSet.has(record.id) ? { ...record, resolved_at: resolvedAt } : record
  );
}
