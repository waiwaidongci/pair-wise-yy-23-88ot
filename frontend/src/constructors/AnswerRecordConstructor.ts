import type { AnswerRecord } from "../types/AnswerRecord";
import type { MistakeReason } from "../constants/MistakeReason";

export const createDefaultAnswerRecord = (overrides: Partial<AnswerRecord> = {}): AnswerRecord => ({
  id: 0,
  session_id: 0,
  symbol_id: 0,
  user_answer: "",
  correct: false,
  latency_ms: 0,
  mistake_reason: "",
  created_at: "",
  resolved_at: "",
  ...overrides
});

export const createAnswerRecordForm = createDefaultAnswerRecord;
export const createAnswerRecordResponse = createDefaultAnswerRecord;

interface AnswerRecordInput {
  id: number;
  sessionId: number;
  symbolId: number;
  userAnswer: string;
  correct: boolean;
  latencyMs: number;
  mistakeReason: MistakeReason | "";
  createdAt: string;
}

export const createSubmittedAnswerRecord = (input: AnswerRecordInput): AnswerRecord =>
  createDefaultAnswerRecord({
    id: input.id,
    session_id: input.sessionId,
    symbol_id: input.symbolId,
    user_answer: input.userAnswer,
    correct: input.correct,
    latency_ms: input.latencyMs,
    mistake_reason: input.mistakeReason,
    created_at: input.createdAt
  });
