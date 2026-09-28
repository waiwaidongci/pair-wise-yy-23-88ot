import type { BrailleSymbol } from "../types/BrailleSymbol";

/** 点字字符默认对象 / 表单对象 / 响应对象构造器，页面与 store 不散写默认结构。 */
export const createDefaultBrailleSymbol = (overrides: Partial<BrailleSymbol> = {}): BrailleSymbol => ({
  id: 0,
  cell_pattern: "",
  letter: "",
  pinyin: "",
  category: "LETTER",
  difficulty: 1,
  audio_hint_key: "",
  ...overrides
});

/** 新建字符的表单初始对象（id 由 IndexedDB 自增分配）。 */
export const createBrailleSymbolForm = (): Partial<BrailleSymbol> =>
  createDefaultBrailleSymbol({ audio_hint_key: "local:new-symbol" });

export const createBrailleSymbolResponse = createDefaultBrailleSymbol;
