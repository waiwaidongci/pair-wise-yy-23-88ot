import type { AnswerRecord } from "../types/AnswerRecord";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";
import type { MasteryLevel } from "../constants/MasteryLevel";

export interface LessonProgressStat {
  lesson: Lesson;
  sessionCount: number;
  answerCount: number;
  correctCount: number;
  accuracy: number;
  avgLatencyMs: number;
  openMistakeCount: number;
  lastSession?: PracticeSession;
  /** 与上一次会话相比的正确率变化（百分点），正数表示进步 */
  accuracyDelta: number | null;
}

export interface SymbolMasteryStat {
  symbolId: number;
  total: number;
  correct: number;
  accuracy: number;
  mastery: MasteryLevel;
}

// 按课程聚合练习次数、正确率、平均用时、错题数和最近一次变化
export function buildLessonProgress(
  lessons: Lesson[],
  sessions: PracticeSession[],
  records: AnswerRecord[]
): LessonProgressStat[] {
  return lessons
    .map((lesson) => {
      const lessonSessions = sessions
        .filter((session) => session.lesson_id === lesson.id)
        .sort((a, b) => a.started_at.localeCompare(b.started_at));
      const sessionIds = new Set(lessonSessions.map((session) => session.id));
      const lessonRecords = records.filter((record) => sessionIds.has(record.session_id));
      const correctCount = lessonRecords.filter((record) => record.correct).length;
      const openMistakeCount = lessonRecords.filter((record) => !record.correct && !record.resolved_at).length;
      const avgLatencyMs = lessonRecords.length
        ? Math.round(lessonRecords.reduce((sum, record) => sum + record.latency_ms, 0) / lessonRecords.length)
        : 0;
      const lastSession = lessonSessions[lessonSessions.length - 1];
      const previousSession = lessonSessions[lessonSessions.length - 2];
      return {
        lesson,
        sessionCount: lessonSessions.length,
        answerCount: lessonRecords.length,
        correctCount,
        accuracy: lessonRecords.length ? correctCount / lessonRecords.length : 0,
        avgLatencyMs,
        openMistakeCount,
        lastSession,
        accuracyDelta:
          lastSession && previousSession
            ? sessionAccuracy(lastSession, records) - sessionAccuracy(previousSession, records)
            : null
      };
    })
    .sort((a, b) => a.lesson.id - b.lesson.id);
}

function sessionAccuracy(session: PracticeSession, records: AnswerRecord[]): number {
  const sessionRecords = records.filter((record) => record.session_id === session.id);
  if (!sessionRecords.length) return 0;
  return sessionRecords.filter((record) => record.correct).length / sessionRecords.length;
}

// 近 N 次会话的正确率趋势，用于进度页图表
export function buildAccuracyTrend(
  sessions: PracticeSession[],
  records: AnswerRecord[],
  limit = 12
): { label: string; accuracy: number; lessonId: number }[] {
  return [...sessions]
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .slice(-limit)
    .map((session) => ({
      label: session.started_at,
      lessonId: session.lesson_id,
      accuracy: sessionAccuracy(session, records)
    }));
}

// 依据答题历史给字符打掌握等级
export function buildSymbolMastery(records: AnswerRecord[]): Map<number, SymbolMasteryStat> {
  const bySymbol = new Map<number, AnswerRecord[]>();
  records.forEach((record) => {
    const list = bySymbol.get(record.symbol_id) ?? [];
    list.push(record);
    bySymbol.set(record.symbol_id, list);
  });
  const result = new Map<number, SymbolMasteryStat>();
  bySymbol.forEach((list, symbolId) => {
    const total = list.length;
    const correct = list.filter((record) => record.correct).length;
    const accuracy = total ? correct / total : 0;
    const lastWrong = [...list].reverse().find((record) => !record.correct);
    const openWrong = Boolean(lastWrong && !lastWrong.resolved_at);
    result.set(symbolId, {
      symbolId,
      total,
      correct,
      accuracy,
      mastery: classifyMastery(total, accuracy, openWrong)
    });
  });
  return result;
}

function classifyMastery(total: number, accuracy: number, hasOpenWrong: boolean): MasteryLevel {
  if (total === 0) return "NEW";
  if (total >= 3 && accuracy >= 0.9 && !hasOpenWrong) return "MASTERED";
  if (accuracy >= 0.7) return "FAMILIAR";
  if (accuracy >= 0.4) return "LEARNING";
  return "NEW";
}
