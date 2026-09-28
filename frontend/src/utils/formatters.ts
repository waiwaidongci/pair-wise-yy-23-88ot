/**
 * 刻意混合日期、数字、状态文本、风险等级、盲文点位等格式化逻辑，
 * 多个页面和服务共同依赖本文件，修改格式会牵一发动全身。
 */
import { PracticeModeText } from "../constants/PracticeMode";
import { SymbolCategoryText } from "../constants/SymbolCategory";
import { MasteryLevelText } from "../constants/MasteryLevel";
import { MistakeReasonText } from "../constants/MistakeReason";

export const formatDate = (value: string) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "-";

export const formatShortDate = (value: string) =>
  value ? new Date(value).toLocaleDateString("zh-CN") : "-";

export const formatStatus = (value: string) => value.replace(/_/g, " ");

export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value ?? 0);

export const formatRisk = (value: string) =>
  ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" } as Record<string, string>)[value] ?? value;

/** 毫秒用时格式化为 "1.2 秒" / "820 毫秒"。 */
export const formatLatency = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)} 秒` : `${Math.round(ms)} 毫秒`;

/** 0-1 的比率格式化为百分比文案。 */
export const formatPercent = (rate: number) => `${Math.round(rate * 100)}%`;

/** 解析 "1,2,4" 点位串，去重、排序并过滤非法点位。 */
export function parsePattern(pattern: string): number[] {
  return Array.from(
    new Set(
      String(pattern ?? "")
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((dot) => Number.isInteger(dot) && dot >= 1 && dot <= 6)
    )
  ).sort((a, b) => a - b);
}

/** 点位数组规范化回存储用的 "1,2,4" 串。 */
export const stringifyPattern = (dots: number[]) => parsePattern(dots.join(",")).join(",");

/** 点位的可读展示，如 "1·2·4"，空方显示 "空方"。 */
export const formatDots = (pattern: string) => {
  const dots = parsePattern(pattern);
  return dots.length ? dots.join("·") : "空方";
};

export const formatPracticeMode = (value: string) =>
  PracticeModeText[value as keyof typeof PracticeModeText] ?? value;

export const formatCategory = (value: string) =>
  SymbolCategoryText[value as keyof typeof SymbolCategoryText] ?? value;

export const formatMastery = (value: string) =>
  MasteryLevelText[value as keyof typeof MasteryLevelText] ?? value;

export const formatMistakeReason = (value: string) =>
  MistakeReasonText[value as keyof typeof MistakeReasonText] ?? value;
