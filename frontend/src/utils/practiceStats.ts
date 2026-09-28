import type { AnswerRecord } from "../types/AnswerRecord";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";
import { masteryOf, type MasteryLevel } from "../constants/MasteryLevel";

/** 进度页按课程聚合的一行统计。 */
export interface LessonStat {
  lesson: Lesson;
  sessionCount: number;
  totalCount: number;
  correctCount: number;
  accuracy: number;
  avgLatencyMs: number;
  mastery: MasteryLevel;
  lastSession?: PracticeSession;
  /** 与上一次会话相比的正确率变化（百分点），用于"最近变化"。 */
  delta: number | null;
}

/** 全局趋势图的一个点。 */
export interface TrendPoint {
  label: string;
  accuracy: number;
  sessionId: number;
}

export function buildLessonStats(
  lessons: Lesson[],
  sessions: PracticeSession[],
  records: AnswerRecord[]
): LessonStat[] {
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  return lessons.map((lesson) => {
    const lessonSessions = sessions
      .filter((session) => session.lesson_id === lesson.id && session.total_count > 0)
      .sort((a, b) => a.started_at.localeCompare(b.started_at));
    const sessionIds = new Set(lessonSessions.map((session) => session.id));
    const lessonRecords = records.filter((record) => sessionIds.has(record.session_id));
    const totalCount = lessonRecords.length;
    const correctCount = lessonRecords.filter((record) => record.correct).length;
    const latencySum = lessonRecords.reduce((sum, record) => sum + record.latency_ms, 0);
    const lastSession = lessonSessions[lessonSessions.length - 1];
    const previous = lessonSessions[lessonSessions.length - 2];
    const delta =
      lastSession && previous
        ? Math.round((lastSession.score - previous.score))
        : null;
    return {
      lesson,
      sessionCount: lessonSessions.length,
      totalCount,
      correctCount,
      accuracy: totalCount === 0 ? 0 : correctCount / totalCount,
      avgLatencyMs: totalCount === 0 ? 0 : Math.round(latencySum / totalCount),
      mastery: masteryOf(totalCount === 0 ? 0 : correctCount / totalCount, totalCount),
      lastSession,
      delta
    };
  });
}

/** 最近若干次会话的正确率趋势（错题复习会话以独立名称展示）。 */
export function buildTrend(sessions: PracticeSession[], limit = 12): TrendPoint[] {
  return [...sessions]
    .filter((session) => session.total_count > 0)
    .sort((a, b) => a.finished_at.localeCompare(b.finished_at))
    .slice(-limit)
    .map((session) => ({
      label: new Date(session.finished_at).toLocaleDateString("zh-CN"),
      accuracy: session.score,
      sessionId: session.id
    }));
}

export interface MistakeSummary {
  total: number;
  unresolved: number;
  byReason: Record<string, number>;
}

export function summarizeMistakes(records: AnswerRecord[]): MistakeSummary {
  const wrong = records.filter((record) => !record.correct);
  const byReason: Record<string, number> = {};
  wrong.forEach((record) => {
    if (!record.resolved) {
      byReason[record.mistake_reason] = (byReason[record.mistake_reason] ?? 0) + 1;
    }
  });
  return {
    total: wrong.length,
    unresolved: wrong.filter((record) => !record.resolved).length,
    byReason
  };
}
