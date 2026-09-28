/** 点字字符分类枚举，贯穿种子数据、筛选器、学习卡片和错题统计。 */
export const SymbolCategory = ["LETTER", "NUMBER", "PUNCTUATION", "CONTRACTION"] as const;
export type SymbolCategory = (typeof SymbolCategory)[number];

export const SymbolCategoryText: Record<SymbolCategory, string> = {
  LETTER: "字母",
  NUMBER: "数字",
  CONTRACTION: "缩略词",
  PUNCTUATION: "标点"
};

export const SYMBOL_CATEGORY_OPTIONS: ReadonlyArray<{ value: SymbolCategory; label: string }> =
  SymbolCategory.map((value) => ({ value, label: SymbolCategoryText[value] }));
