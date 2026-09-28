import { useMemo } from "react";
import { PageHeader } from "../components/PageHeader";
import { ChartPanel } from "../components/common/ChartPanel";
import { EmptyState } from "../components/common/EmptyState";
import { LessonProgress } from "../components/common/LessonProgress";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { useIndexedDbStore } from "../hooks/useIndexedDbStore";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { buildAccuracyTrend, buildLessonProgress } from "../services/progressService";
import { formatDate, formatLatency, formatPercent } from "../utils/formatters";
import type { LessonProgressStat } from "../services/progressService";

export function ProgressPage() {
  const lessonStore = useLessonStore();
  const sessionStore = usePracticeSessionStore();
  const answerStore = useAnswerRecordStore();
  useIndexedDbStore([lessonStore, sessionStore, answerStore]);

  const stats = useMemo(
    () => buildLessonProgress(lessonStore.rows, sessionStore.rows, answerStore.rows),
    [lessonStore.rows, sessionStore.rows, answerStore.rows]
  );
  const trend = useMemo(
    () => buildAccuracyTrend(sessionStore.rows, answerStore.rows),
    [sessionStore.rows, answerStore.rows]
  );

  const totalSessions = sessionStore.rows.length;
  const totalAnswers = answerStore.rows.length;
  const totalCorrect = answerStore.rows.filter((record) => record.correct).length;
  const openMistakes = answerStore.rows.filter((record) => !record.correct && !record.resolved_at).length;
  const hasRecord = totalSessions > 0;

  return (
    <main className="page">
      <PageHeader title="学习进度" description="按课程查看练习次数、正确率、用时与最近一次变化。" />

      <section className="metrics">
        <StatCard label="累计练习" value={`${totalSessions} 次`} />
        <StatCard label="累计答题" value={totalAnswers} hint={`正确率 ${formatPercent(totalCorrect, totalAnswers)}`} />
        <StatCard label="待处理错题" value={openMistakes} />
      </section>

      {!hasRecord ? (
        <EmptyState
          title="还没有练习记录"
          description="去练习模式完成一组字符练习后，这里会按课程展示练习次数、正确率和最近变化。"
        />
      ) : (
        <>
          <ChartPanel title="最近练习正确率趋势" points={trend.map((point) => ({ label: formatDate(point.label), value: point.accuracy }))} />
          <section className="panel">
            <h2>按课程统计</h2>
            <div className="progress-table">
              <div className="progress-table-head">
                <span>课程</span>
                <span>练习次数</span>
                <span>正确率</span>
                <span>平均每题用时</span>
                <span>最近练习</span>
                <span>变化</span>
              </div>
              {stats.map((stat) => (
                <LessonProgressRow key={stat.lesson.id} stat={stat} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function LessonProgressRow({ stat }: { stat: LessonProgressStat }) {
  const practiced = stat.sessionCount > 0;
  return (
    <article className={`progress-row ${practiced ? "" : "is-empty"}`}>
      <div className="progress-cell lesson-cell">
        <strong>{stat.lesson.title}</strong>
        <small>
          {stat.lesson.stage} · {stat.lesson.symbol_ids.length} 字符
        </small>
        {practiced && (
          <LessonProgress
            title=""
            current={stat.correctCount}
            total={stat.answerCount}
            correct={stat.correctCount}
            compact
          />
        )}
      </div>
      <div className="progress-cell">{stat.sessionCount} 次</div>
      <div className="progress-cell">{practiced ? formatPercent(stat.correctCount, stat.answerCount) : "—"}</div>
      <div className="progress-cell">{practiced ? formatLatency(stat.avgLatencyMs) : "—"}</div>
      <div className="progress-cell">
        {stat.lastSession ? (
          <>
            <StatusBadge value={`${stat.lastSession.score} 分`} tone={scoreTone(stat.lastSession.score)} />
            <small>{formatDate(stat.lastSession.finished_at)}</small>
          </>
        ) : (
          <span className="muted">未练习</span>
        )}
      </div>
      <div className="progress-cell">
        {stat.accuracyDelta === null ? (
          <span className="muted">—</span>
        ) : (
          <span className={`delta ${stat.accuracyDelta > 0 ? "up" : stat.accuracyDelta < 0 ? "down" : "flat"}`}>
            {stat.accuracyDelta > 0 ? "▲" : stat.accuracyDelta < 0 ? "▼" : "—"}{" "}
            {stat.accuracyDelta !== 0 ? `${Math.abs(Math.round(stat.accuracyDelta * 100))} 个百分点` : "持平"}
          </span>
        )}
        {practiced && stat.openMistakeCount > 0 && <small className="warn-text">{stat.openMistakeCount} 道错题待巩固</small>}
      </div>
    </article>
  );
}

function scoreTone(score: number): "good" | "warn" | "bad" | "neutral" {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}
