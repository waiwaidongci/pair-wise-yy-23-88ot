export const PracticeMode = ["CELL_TO_TEXT", "TEXT_TO_CELL", "LISTENING", "MIXED"] as const;
export type PracticeMode = (typeof PracticeMode)[number];

// 具体出题模式：MIXED 在出题时展开为下面三种之一
export type PromptMode = Exclude<PracticeMode, "MIXED">;

export const PracticeModeText: Record<PracticeMode, string> = {
  CELL_TO_TEXT: "看点阵选文字",
  TEXT_TO_CELL: "看文字选点位",
  LISTENING: "听读音选文字",
  MIXED: "混合练习"
};
