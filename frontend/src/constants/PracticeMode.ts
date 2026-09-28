/**
 * 练习模式枚举。
 * CELL_TO_TEXT：看点阵选文字（点阵识别）
 * TEXT_TO_CELL：看文字，在点阵上选点（文字选点）
 * LISTENING：听写模拟（浏览器语音朗读提示）
 * MIXED：以上题型混合
 */
export const PracticeMode = ["CELL_TO_TEXT", "TEXT_TO_CELL", "LISTENING", "MIXED"] as const;
export type PracticeMode = (typeof PracticeMode)[number];

export const PracticeModeText: Record<PracticeMode, string> = {
  CELL_TO_TEXT: "点阵识别",
  TEXT_TO_CELL: "文字选点",
  LISTENING: "听写练习",
  MIXED: "混合模式"
};

/** 练习页与错题复习发起处共用的模式筛选器选项。 */
export const PRACTICE_MODE_OPTIONS: ReadonlyArray<{ value: PracticeMode; label: string }> =
  PracticeMode.map((value) => ({ value, label: PracticeModeText[value] }));
