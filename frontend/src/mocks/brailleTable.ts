import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { Lesson } from "../types/Lesson";

/**
 * 标准英语盲文（国标点位编号 1-6）种子数据。
 * 点位约定：左上 1、左中 2、左下 3、右上 4、右中 5、右下 6。
 * 与 mocks/seedData.ts 保持同步：新增字符需同步课程与种子导出。
 */
interface SeedSymbol {
  id: number;
  pattern: string;
  letter: string;
  pinyin: string;
  category: BrailleSymbol["category"];
  difficulty: number;
}

const letterRows: Array<[string, string, string, number]> = [
  ["a", "1", "字母 a", 1],
  ["b", "1,2", "字母 b", 1],
  ["c", "1,4", "字母 c", 1],
  ["d", "1,4,5", "字母 d", 1],
  ["e", "1,5", "字母 e", 1],
  ["f", "1,2,4", "字母 f", 1],
  ["g", "1,2,4,5", "字母 g", 2],
  ["h", "1,2,5", "字母 h", 2],
  ["i", "2,4", "字母 i", 2],
  ["j", "2,4,5", "字母 j", 2],
  ["k", "1,3", "字母 k", 2],
  ["l", "1,2,3", "字母 l", 2],
  ["m", "1,3,4", "字母 m", 2],
  ["n", "1,3,4,5", "字母 n", 2],
  ["o", "1,3,5", "字母 o", 2],
  ["p", "1,2,3,4", "字母 p", 3],
  ["q", "1,2,3,4,5", "字母 q", 3],
  ["r", "1,2,3,5", "字母 r", 3],
  ["s", "2,3,4", "字母 s", 3],
  ["t", "2,3,4,5", "字母 t", 3],
  ["u", "1,3,6", "字母 u", 3],
  ["v", "1,2,3,6", "字母 v", 3],
  ["w", "2,4,5,6", "字母 w", 3],
  ["x", "1,3,4,6", "字母 x", 4],
  ["y", "1,3,4,5,6", "字母 y", 4],
  ["z", "1,3,5,6", "字母 z", 4]
];

const numberRows: Array<[string, string, string]> = [
  ["1", "1", "数字 1"],
  ["2", "1,2", "数字 2"],
  ["3", "1,4", "数字 3"],
  ["4", "1,4,5", "数字 4"],
  ["5", "1,5", "数字 5"],
  ["6", "1,2,4", "数字 6"],
  ["7", "1,2,4,5", "数字 7"],
  ["8", "1,2,5", "数字 8"],
  ["9", "2,4", "数字 9"],
  ["0", "2,4,5", "数字 0"]
];

const punctuationRows: Array<[string, string, string, number]> = [
  [",", "2", "逗号", 2],
  [";", "2,3", "分号", 3],
  [":", "2,5", "冒号", 3],
  [".", "2,5,6", "句号", 2],
  ["!", "2,3,5", "感叹号", 3],
  ["?", "2,3,6", "问号", 3]
];

const contractionRows: Array<[string, string, string, number]> = [
  ["and", "1,2,3,4,6", "缩略词 and", 4],
  ["for", "1,2,3,4,5,6", "缩略词 for", 4],
  ["the", "2,3,4,6", "缩略词 the", 4],
  ["with", "2,3,4,5,6", "缩略词 with", 5]
];

function buildSeeds(): SeedSymbol[] {
  const rows: SeedSymbol[] = [];
  letterRows.forEach(([letter, pattern, pinyin, difficulty], index) => {
    rows.push({ id: index + 1, pattern, letter, pinyin, category: "LETTER", difficulty });
  });
  numberRows.forEach(([letter, pattern, pinyin], index) => {
    rows.push({ id: 100 + index + 1, pattern, letter, pinyin, category: "NUMBER", difficulty: 2 });
  });
  punctuationRows.forEach(([letter, pattern, pinyin, difficulty], index) => {
    rows.push({ id: 200 + index + 1, pattern, letter, pinyin, category: "PUNCTUATION", difficulty });
  });
  contractionRows.forEach(([letter, pattern, pinyin, difficulty], index) => {
    rows.push({ id: 300 + index + 1, pattern, letter, pinyin, category: "CONTRACTION", difficulty });
  });
  return rows;
}

export const SEED_SYMBOLS: SeedSymbol[] = buildSeeds();

/** 课程种子：按学习阶段组织字符。 */
export const SEED_LESSONS: Array<Omit<Lesson, "id"> & { id: number }> = [
  {
    id: 1,
    title: "第一课 · 基础字母 a-j",
    symbol_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    stage: "入门",
    estimated_minutes: 10,
    unlock_rule: "默认开放"
  },
  {
    id: 2,
    title: "第二课 · 字母 k-t",
    symbol_ids: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    stage: "基础",
    estimated_minutes: 12,
    unlock_rule: "完成入门课程后开放"
  },
  {
    id: 3,
    title: "第三课 · 字母 u-z 与数字",
    symbol_ids: [21, 22, 23, 24, 25, 26, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
    stage: "进阶",
    estimated_minutes: 15,
    unlock_rule: "完成基础课程后开放"
  },
  {
    id: 4,
    title: "第四课 · 标点与缩略词",
    symbol_ids: [201, 202, 203, 204, 205, 206, 301, 302, 303, 304],
    stage: "提高",
    estimated_minutes: 12,
    unlock_rule: "完成进阶课程后开放"
  }
];

/** 供 api 层转换为 BrailleSymbol 实体。 */
export function toSeedBrailleSymbols(): BrailleSymbol[] {
  return SEED_SYMBOLS.map(({ id, pattern, letter, pinyin, category, difficulty }) => ({
    id,
    cell_pattern: pattern,
    letter,
    pinyin,
    category,
    difficulty,
    audio_hint_key: `seed:${category.toLowerCase()}:${letter}`
  }));
}
