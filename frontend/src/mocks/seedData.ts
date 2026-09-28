import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";

// 点位编号：1 4 / 2 5 / 3 6
const letterRows: BrailleSymbol[] = [
  ["a", "1", "诶"], ["b", "1,2", "必"], ["c", "1,4", "西"], ["d", "1,4,5", "第"],
  ["e", "1,5", "伊"], ["f", "1,2,4", "艾弗"], ["g", "1,2,4,5", "记"], ["h", "1,2,5", "艾曲"],
  ["i", "2,4", "艾"], ["j", "2,4,5", "杰"], ["k", "1,3", "开"], ["l", "1,2,3", "艾尔"],
  ["m", "1,3,4", "艾姆"], ["n", "1,3,4,5", "恩"], ["o", "1,3,5", "欧"], ["p", "1,2,3,4", "屁"],
  ["q", "1,2,3,4,5", "丘"], ["r", "1,2,3,5", "阿尔"], ["s", "2,3,4", "艾斯"], ["t", "2,3,4,5", "替"],
  ["u", "1,3,6", "优"], ["v", "1,2,3,6", "维"], ["w", "2,4,5,6", "达布尔优"], ["x", "1,3,4,6", "艾克斯"],
  ["y", "1,3,4,5,6", "歪"], ["z", "1,3,5,6", "兹"]
].map(([letter, pattern, pinyin], index) => ({
  id: index + 1,
  cell_pattern: pattern,
  letter,
  pinyin: `字母 ${letter}（${pinyin}）`,
  category: "LETTER",
  difficulty: index < 10 ? "EASY" : index < 20 ? "MEDIUM" : "HARD",
  audio_hint_key: `letter:${letter}`
}));

const digitRows: BrailleSymbol[] = [
  ["1", "1", "一"], ["2", "1,2", "二"], ["3", "1,4", "三"], ["4", "1,4,5", "四"],
  ["5", "1,5", "五"], ["6", "1,2,4", "六"], ["7", "1,2,4,5", "七"], ["8", "1,2,5", "八"],
  ["9", "2,4", "九"], ["0", "2,4,5", "零"]
].map(([letter, pattern, pinyin], index) => ({
  id: 27 + index,
  cell_pattern: pattern,
  letter,
  pinyin: `数字 ${pinyin}`,
  category: "NUMBER",
  difficulty: "EASY",
  audio_hint_key: `digit:${letter}`
}));

const punctuationRows: BrailleSymbol[] = [
  ["，", "2", "逗号"], ["。", "2,5,6", "句号"], ["？", "2,3,6", "问号"], ["！", "2,3,5", "叹号"]
].map(([letter, pattern, pinyin], index) => ({
  id: 37 + index,
  cell_pattern: pattern,
  letter,
  pinyin,
  category: "PUNCTUATION",
  difficulty: "MEDIUM",
  audio_hint_key: `punct:${pinyin}`
}));

const contractionRows: BrailleSymbol[] = [
  ["and", "1,2,3,4,6", "连词 and"], ["for", "1,2,3,4,5,6", "介词 for"],
  ["the", "2,3,4,6", "定冠词 the"], ["with", "2,3,4,5,6", "介词 with"]
].map(([letter, pattern, pinyin], index) => ({
  id: 41 + index,
  cell_pattern: pattern,
  letter,
  pinyin,
  category: "CONTRACTION",
  difficulty: "HARD",
  audio_hint_key: `word:${letter}`
}));

export const seedBrailleSymbols: BrailleSymbol[] = [
  ...letterRows,
  ...digitRows,
  ...punctuationRows,
  ...contractionRows
];

export const seedLessons: Lesson[] = [
  { id: 1, title: "元音初识", symbol_ids: [1, 5, 9, 15, 21], stage: "入门", estimated_minutes: 5, unlock_rule: "初始开放" },
  { id: 2, title: "字母 a–j", symbol_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], stage: "基础", estimated_minutes: 8, unlock_rule: "初始开放" },
  { id: 3, title: "字母 k–t", symbol_ids: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], stage: "基础", estimated_minutes: 10, unlock_rule: "完成《字母 a–j》" },
  { id: 4, title: "字母 u–z", symbol_ids: [21, 22, 23, 24, 25, 26], stage: "进阶", estimated_minutes: 8, unlock_rule: "完成《字母 k–t》" },
  { id: 5, title: "数字 1–0", symbol_ids: digitRows.map((row) => row.id), stage: "进阶", estimated_minutes: 6, unlock_rule: "完成《元音初识》" },
  { id: 6, title: "标点与常用缩略", symbol_ids: [...punctuationRows, ...contractionRows].map((row) => row.id), stage: "挑战", estimated_minutes: 8, unlock_rule: "完成《字母 a–j》" }
];

// 练习数据完全由学习者本机产生，种子不预置任何会话或答题记录
export const seedPracticeSessions: PracticeSession[] = [];
export const seedAnswerRecords: AnswerRecord[] = [];

export const mockData = {
  brailleSymbol: seedBrailleSymbols,
  lesson: seedLessons,
  practiceSession: seedPracticeSessions,
  answerRecord: seedAnswerRecords
};
