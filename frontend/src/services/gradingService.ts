import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { PracticeMode, PromptMode } from "../constants/PracticeMode";
import type { MistakeReason } from "../constants/MistakeReason";
import { parseDots, sameDots } from "../utils/brailleDots";
import { shuffle } from "../utils/collection";

export interface PracticeQuestion {
  symbol: BrailleSymbol;
  /** 本题实际采用的提示模式（MIXED 会在出题时展开为具体模式） */
  promptMode: PromptMode;
  /** 候选字符；看文字选点时无需候选项 */
  options: BrailleSymbol[];
}

const CHOICE_OPTION_COUNT = 4;

// 从课程字符中构造一组打乱顺序的题目
export function buildQuestions(symbols: BrailleSymbol[], mode: PracticeMode): PracticeQuestion[] {
  return shuffle(symbols).map((symbol) => {
    const promptMode: PromptMode =
      mode === "MIXED"
        ? (shuffle(["CELL_TO_TEXT", "TEXT_TO_CELL", "LISTENING"] as PromptMode[])[0])
        : (mode as PromptMode);
    return {
      symbol,
      promptMode,
      options: promptMode === "TEXT_TO_CELL" ? [] : buildOptions(symbol, symbols)
    };
  });
}

function buildOptions(answer: BrailleSymbol, pool: BrailleSymbol[]): BrailleSymbol[] {
  const distractors = shuffle(pool.filter((row) => row.id !== answer.id)).slice(0, CHOICE_OPTION_COUNT - 1);
  return shuffle([answer, ...distractors]);
}

export interface GradeResult {
  correct: boolean;
  mistakeReason: MistakeReason | "";
}

// 判定一次作答：文字类选择按字符是否相同，点位类按点位集合差异给出错误原因
export function gradeAnswer(question: PracticeQuestion, userAnswer: string): GradeResult {
  const { symbol, promptMode } = question;
  if (promptMode === "TEXT_TO_CELL") {
    if (sameDots(userAnswer, symbol.cell_pattern)) return { correct: true, mistakeReason: "" };
    return { correct: false, mistakeReason: classifyDotMistake(userAnswer, symbol.cell_pattern) };
  }
  if (normalizeText(userAnswer) === normalizeText(symbol.letter)) {
    return { correct: true, mistakeReason: "" };
  }
  return { correct: false, mistakeReason: "WRONG_CHAR" };
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function classifyDotMistake(userPattern: string, targetPattern: string): MistakeReason {
  const user = new Set(parseDots(userPattern));
  const target = new Set(parseDots(targetPattern));
  const missed = [...target].filter((dot) => !user.has(dot));
  const extra = [...user].filter((dot) => !target.has(dot));
  if (missed.length && !extra.length) return "MISSED_DOT";
  if (extra.length && !missed.length) return "EXTRA_DOT";
  return "PATTERN_MISMATCH";
}
