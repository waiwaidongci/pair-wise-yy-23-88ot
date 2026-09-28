/**
 * 错题原因枚举。判题时根据用户点位与正确点位的差异自动归类：
 * WRONG_PICK：点阵识别时选错字符（差异不可用单纯多点/少点解释）
 * DOT_MISSED：文字选点时漏掉了本应凸起的点
 * DOT_EXTRA：文字选点时多点了不该凸起的点
 * SKIPPED：听写模式未能作答（预留）
 */
export const MistakeReason = ["WRONG_PICK", "DOT_MISSED", "DOT_EXTRA", "SKIPPED"] as const;
export type MistakeReason = (typeof MistakeReason)[number];

export const MistakeReasonText: Record<MistakeReason, string> = {
  WRONG_PICK: "选错字符",
  DOT_MISSED: "漏点",
  DOT_EXTRA: "多点",
  SKIPPED: "未作答"
};

/** 错题本筛选器选项；"ALL" 由页面单独追加，不写入记录。 */
export const MISTAKE_REASON_OPTIONS: ReadonlyArray<{ value: MistakeReason; label: string }> =
  MistakeReason.map((value) => ({ value, label: MistakeReasonText[value] }));
