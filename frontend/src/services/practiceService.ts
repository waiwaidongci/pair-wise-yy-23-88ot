import { createPracticeSession, persistSessionWithAnswers } from "../api/PracticeSession";
import { createPracticeSessionForm } from "../constructors/PracticeSessionConstructor";
import { createAnswerRecordForm } from "../constructors/AnswerRecordConstructor";
import type { AnswerRecordInput } from "../types/AnswerRecord";
import type { PracticeSession } from "../types/PracticeSession";
import type { PracticeMode } from "../types/PracticeMode";
import type { GradeResult, PracticeQuestion } from "../utils/practice";
import { scoreOf } from "../utils/practice";
import { ServiceError } from "../utils/errors";

/** 单题提交后回传给页面的即时反馈结构。 */
export interface SubmittedAnswer {
  question: PracticeQuestion;
  grade: GradeResult;
  latencyMs: number;
}

/** 业务层包装：开始一次练习，会话立即落本机库。 */
export async function startPracticeSession(lessonId: number, mode: PracticeMode): Promise<PracticeSession> {
  try {
    return await createPracticeSession(createPracticeSessionForm(lessonId, mode));
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("SESSION_INVALID", cause);
  }
}

/**
 * 业务层包装：结束练习，把逐题结果折算成得分并随会话一起持久化。
 * 即时反馈所需的对错/用时在提交时已经返回给页面，这里负责落库。
 */
export async function completePracticeSession(
  session: PracticeSession,
  answers: SubmittedAnswer[]
): Promise<{ session: PracticeSession; records: AnswerRecordInput[] }> {
  if (!session || !session.id) {
    throw new ServiceError("SESSION_INVALID");
  }
  const records: AnswerRecordInput[] = answers.map(({ question, grade, latencyMs }) =>
    createAnswerRecordForm({
      session_id: session.id,
      symbol_id: question.symbol.id,
      user_answer: grade.normalized,
      correct: grade.correct,
      latency_ms: latencyMs,
      mistake_reason: grade.mistake_reason
    })
  );
  const mistakeCount = records.filter((record) => !record.correct).length;
  const finalSession: PracticeSession = {
    ...session,
    finished_at: new Date().toISOString(),
    score: scoreOf(records.length - mistakeCount, records.length),
    mistake_count: mistakeCount,
    total_count: records.length
  };
  try {
    const persisted = await persistSessionWithAnswers(finalSession, records);
    return { session: persisted.session, records };
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("ANSWER_REJECTED", cause);
  }
}
