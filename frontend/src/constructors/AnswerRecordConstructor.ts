import type { AnswerRecord, AnswerRecordInput } from "../types/AnswerRecord";
import type { MistakeReason } from "../constants/MistakeReason";

export const createDefaultAnswerRecord = (overrides: Partial<AnswerRecord> = {}): AnswerRecord => ({
  id: 0,
  session_id: 0,
  symbol_id: 0,
  user_answer: "",
  correct: false,
  latency_ms: 0,
  mistake_reason: "",
  resolved: false,
  ...overrides
});

/** 提交一道题的作答记录（id 与 session_id 由数据层/会话补全）。 */
export const createAnswerRecordForm = (params: {
  session_id: number;
  symbol_id: number;
  user_answer: string;
  correct: boolean;
  latency_ms: number;
  mistake_reason: MistakeReason | "";
}): AnswerRecordInput => createDefaultAnswerRecord(params) as AnswerRecordInput;

export const createAnswerRecordResponse = createDefaultAnswerRecord;
