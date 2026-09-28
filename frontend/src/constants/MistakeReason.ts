// 错题原因：看模式选不出字符归为认错；文字选点位时按点位差异细分
export const MistakeReason = ["WRONG_CHAR", "MISSED_DOT", "EXTRA_DOT", "PATTERN_MISMATCH"] as const;
export type MistakeReason = (typeof MistakeReason)[number];

export const MistakeReasonText: Record<MistakeReason, string> = {
  WRONG_CHAR: "字符认错",
  MISSED_DOT: "漏点",
  EXTRA_DOT: "多点",
  PATTERN_MISMATCH: "点位不符"
};
