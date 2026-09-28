export const DifficultyLevel = ["EASY", "MEDIUM", "HARD"] as const;
export type DifficultyLevel = (typeof DifficultyLevel)[number];

export const DifficultyLevelText: Record<DifficultyLevel, string> = {
  EASY: "简单",
  MEDIUM: "中等",
  HARD: "困难"
};
