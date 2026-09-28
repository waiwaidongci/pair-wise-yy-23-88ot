// 混合日期、数字、状态、用时、正确率等多种格式化逻辑，供多个页面共同依赖
import { PracticeModeText } from "../constants/PracticeMode";
import { SymbolCategoryText } from "../constants/SymbolCategory";
import { MasteryLevelText } from "../constants/MasteryLevel";
import { MistakeReasonText } from "../constants/MistakeReason";
import { DifficultyLevelText } from "../constants/DifficultyLevel";
import type { PracticeMode } from "../constants/PracticeMode";
import type { SymbolCategory } from "../constants/SymbolCategory";
import type { MasteryLevel } from "../constants/MasteryLevel";
import type { MistakeReason } from "../constants/MistakeReason";
import type { DifficultyLevel } from "../constants/DifficultyLevel";

export const formatDate = (value: string | number | Date): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export const formatFullDate = (value: string | number | Date): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("zh-CN");
};

export const formatNumber = (value: number): string => new Intl.NumberFormat("zh-CN").format(value);

export const formatPercent = (correct: number, total: number): string => {
  if (!total) return "0%";
  return `${Math.round((correct / total) * 100)}%`;
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms} 毫秒`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} 秒`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes} 分 ${rest} 秒`;
};

export const formatLatency = (ms: number): string => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

export const formatStatus = (value: string): string => value.replace(/_/g, " ");

// 兼容旧调用方的风险等级文案
export const formatRisk = (value: string): string =>
  ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" } as Record<string, string>)[value] ?? value;

export const formatPracticeMode = (value: PracticeMode): string => PracticeModeText[value];
export const formatSymbolCategory = (value: SymbolCategory): string => SymbolCategoryText[value];
export const formatMasteryLevel = (value: MasteryLevel): string => MasteryLevelText[value];
export const formatMistakeReason = (value: MistakeReason | ""): string =>
  value ? MistakeReasonText[value] : "—";
export const formatDifficulty = (value: DifficultyLevel): string => DifficultyLevelText[value];
