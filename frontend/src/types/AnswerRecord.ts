import type { MistakeReason } from "../constants/MistakeReason";

export interface AnswerRecord {
  id: number;
  session_id: number;
  symbol_id: number;
  /** 用户提交的答案（文字或点位串，如 "1,3,4"） */
  user_answer: string;
  correct: boolean;
  latency_ms: number;
  /** 仅答错时有值 */
  mistake_reason: MistakeReason | "";
  created_at: string;
  /** 错题被重新答对或手动标记掌握的时间；空串表示仍在错题本中 */
  resolved_at: string;
}
