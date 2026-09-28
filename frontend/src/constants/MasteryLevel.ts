/** 掌握程度枚举：用于学习卡片与进度页的掌握度推导、展示和筛选。 */
export const MasteryLevel = ["NEW", "LEARNING", "FAMILIAR", "MASTERED"] as const;
export type MasteryLevel = (typeof MasteryLevel)[number];

export const MasteryLevelText: Record<MasteryLevel, string> = {
  NEW: "未学",
  LEARNING: "学习中",
  FAMILIAR: "熟悉",
  MASTERED: "已掌握"
};

/** 根据字符的答题正确率推导掌握程度，供 store / 页面 / 筛选器共用。 */
export function masteryOf(rate: number, attempts: number): MasteryLevel {
  if (attempts === 0) return "NEW";
  if (rate >= 0.9) return "MASTERED";
  if (rate >= 0.7) return "FAMILIAR";
  return "LEARNING";
}

export const MASTERY_LEVEL_OPTIONS: ReadonlyArray<{ value: MasteryLevel; label: string }> =
  MasteryLevel.map((value) => ({ value, label: MasteryLevelText[value] }));
