import type { MistakeReason } from "../constants/MistakeReason";

export interface AnswerRecord {
  id: number;
  session_id: number;
  symbol_id: number;
  /** 用户实际选择的字符或点位串（规范化后保存）。 */
  user_answer: string;
  correct: boolean;
  latency_ms: number;
  mistake_reason: MistakeReason | "";
  /** 错题是否已被后续重新答对而消化（错题本只展示未消化记录）。 */
  resolved: boolean;
}

export type AnswerRecordInput = Omit<AnswerRecord, "id">;
