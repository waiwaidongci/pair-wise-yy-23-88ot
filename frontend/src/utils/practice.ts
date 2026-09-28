import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { PracticeMode } from "../constants/PracticeMode";
import type { MistakeReason } from "../constants/MistakeReason";
import { parsePattern, stringifyPattern } from "./formatters";

/** 一道练习题：题型由 kind 决定，目标字符固定。 */
export interface PracticeQuestion {
  symbol: BrailleSymbol;
  kind: Exclude<PracticeMode, "MIXED">;
  /** 选择题的候选字符（点阵识别 / 听写时使用）。 */
  options: BrailleSymbol[];
}

export interface GradeResult {
  correct: boolean;
  mistake_reason: MistakeReason | "";
  /** 规范化后的用户答案，用于落库展示。 */
  normalized: string;
}

export function shuffle<T>(rows: T[]): T[] {
  const copy = [...rows];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** MIXED 题型在三种具体题型间随机摊派。 */
function resolveKind(mode: PracticeMode): PracticeQuestion["kind"] {
  if (mode === "MIXED") {
    const pool: PracticeQuestion["kind"][] = ["CELL_TO_TEXT", "TEXT_TO_CELL", "LISTENING"];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return mode;
}

/**
 * 从课程字符中构造一组题：
 * 题序随机；选择题（识别/听写）附带 3 个同分类优先的干扰项。
 */
export function buildQuestions(
  pool: BrailleSymbol[],
  mode: PracticeMode,
  limit = Math.min(pool.length, 10)
): PracticeQuestion[] {
  if (pool.length === 0) return [];
  const targets = shuffle(pool).slice(0, Math.max(1, Math.min(limit, pool.length)));
  return targets.map((symbol) => {
    const kind = resolveKind(mode);
    return { symbol, kind, options: kind === "TEXT_TO_CELL" ? [] : buildOptions(symbol, pool) };
  });
}

export function buildOptions(target: BrailleSymbol, pool: BrailleSymbol[], size = 4): BrailleSymbol[] {
  const sameCategory = shuffle(pool.filter((row) => row.category === target.category && row.id !== target.id));
  const others = shuffle(pool.filter((row) => row.category !== target.category && row.id !== target.id));
  const distractors = [...sameCategory, ...others].slice(0, size - 1);
  return shuffle([target, ...distractors]);
}

/** 点阵识别 / 听写：按用户选中的字符判对错。 */
export function gradeChoice(picked: BrailleSymbol | undefined, target: BrailleSymbol): GradeResult {
  if (!picked) {
    return { correct: false, mistake_reason: "SKIPPED", normalized: "" };
  }
  return {
    correct: picked.id === target.id,
    mistake_reason: picked.id === target.id ? "" : "WRONG_PICK",
    normalized: picked.letter
  };
}

/** 文字选点：比较两个点集，自动归类漏点 / 多点。 */
export function gradeDots(selectedDots: number[], target: BrailleSymbol): GradeResult {
  const picked = parsePattern(stringifyPattern(selectedDots));
  const expected = parsePattern(target.cell_pattern);
  const pickedSet = new Set(picked);
  const expectedSet = new Set(expected);
  const missed = expected.filter((dot) => !pickedSet.has(dot));
  const extra = picked.filter((dot) => !expectedSet.has(dot));
  const correct = missed.length === 0 && extra.length === 0;
  let mistake_reason: MistakeReason | "" = "";
  if (!correct) {
    // 同时漏点和多点时，按"差异更严重"的一侧归类：漏点优先。
    mistake_reason = missed.length >= extra.length ? "DOT_MISSED" : "DOT_EXTRA";
  }
  return { correct, mistake_reason, normalized: picked.join(",") };
}

/** 会话得分：正确率折算到 0-100。 */
export const scoreOf = (correctCount: number, totalCount: number) =>
  totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
