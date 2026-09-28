import { useMemo } from "react";
import { StatusBadge } from "../components/common/StatusBadge";
import { StatCard } from "../components/common/StatCard";
import { EmptyState } from "../components/common/EmptyState";
import { LessonProgress } from "../components/common/LessonProgress";
import { ChartPanel } from "../components/common/ChartPanel";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { buildLessonStats, buildTrend } from "../utils/practiceStats";
import { formatDate, formatLatency, formatPercent, formatPracticeMode } from "../utils/formatters";

/**
 * 学习进度页：按课程展示练习次数、答题数、正确率与最近一次的变化，
 * 顶部展示总体指标与最近会话正确率趋势；没有任何练习记录时给出空状态。
 * 全部统计都从本机 IndexedDB 装载的会话与答题记录实时计算。
 */
export function ProgressPage() {
  const lessons = useLessonStore((state) => state.rows);
  const sessions = usePracticeSessionStore((state) => state.rows);
  const records = useAnswerRecordStore((state) => state.rows);

  const stats = useMemo(() => buildLessonStats(lessons, sessions, records), [lessons, sessions, records]);
  const trend = useMemo(() => buildTrend(sessions), [sessions]);
  const totalSessions = sessions.filter((session) => session.total_count > 0).length;
  const answered = records.length;
  const correctTotal = records.filter((record) => record.correct).length;
  const reviewSessions = sessions.filter((session) => session.lesson_id === 0 && session.total_count > 0);

  if (totalSessions === 0) {
    return (
      <main className="page">
        <section className="page-head">
          <div>
            <p className="eyebrow">braille-trainer / progress</p>
            <h1>学习进度</h1>
          </div>
          <StatusBadge value="LOCAL_DATA" />
        </section>
        <EmptyState
          title="还没有练习记录"
          description="完成一次课程练习或错题复习后，这里会按课程展示练习次数、正确率和最近变化。"
          action={
            <button type="button" className="btn primary" onClick={() => (window.location.hash = "/practice")}>
              开始第一次练习
            </button>
          }
        />
      </main>
    );
  }

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">braille-trainer / progress</p>
          <h1>学习进度</h1>
        </div>
        <StatusBadge value="LOCAL_DATA" />
      </section>

      <section className="metrics">
        <StatCard label="练习次数" value={totalSessions} />
        <StatCard label="累计答题" value={answered} />
        <StatCard label="总正确率" value={formatPercent(answered ? correctTotal / answered : 0)} />
      </section>

      <ChartPanel title="最近练习正确率趋势" points={trend.map((point) => ({ ...point, value: point.accuracy }))} />

      <section className="panel">
        <h2>按课程统计</h2>
        <div className="table">
          {stats.map((stat) => (
            <article key={stat.lesson.id} className="lesson-stat-row">
              <div className="lesson-stat-head">
                <strong>{stat.lesson.title}</strong>
                <span className="muted">{stat.lesson.stage} 阶段</span>
                <StatusBadge value={stat.mastery} kind="MasteryLevel" />
              </div>
              <div className="lesson-stat-body">
                <span>练习 <strong>{stat.sessionCount}</strong> 次</span>
                <span>答题 <strong>{stat.totalCount}</strong> 道</span>
                <span>正确率 <strong>{formatPercent(stat.accuracy)}</strong></span>
                <span>平均用时 <strong>{stat.totalCount ? formatLatency(stat.avgLatencyMs) : "-"}</strong></span>
                <span className={stat.delta === null ? "muted" : stat.delta >= 0 ? "delta-up" : "delta-down"}>
                  最近变化：
                  {stat.delta === null
                    ? "再练一次后显示"
                    : `${stat.delta > 0 ? "▲" : stat.delta < 0 ? "▼" : "—"} ${Math.abs(stat.delta)} 分`}
                </span>
              </div>
              <LessonProgress accuracy={stat.accuracy} correctCount={stat.correctCount} totalCount={stat.totalCount} />
              <p className="muted">
                最近练习：
                {stat.lastSession
                  ? `${formatDate(stat.lastSession.finished_at)} · ${formatPracticeMode(stat.lastSession.mode)} · 得分 ${stat.lastSession.score}`
                  : "暂无"}
              </p>
            </article>
          ))}
        </div>
      </section>

      {reviewSessions.length > 0 && (
        <section className="panel">
          <h2>错题复习记录</h2>
          <ul className="review-history">
            {reviewSessions.slice(0, 5).map((session) => (
              <li key={session.id} className="row">
                <span>{formatDate(session.finished_at)}</span>
                <StatusBadge value={session.mode} kind="PracticeMode" />
                <span className="muted">
                  {session.total_count - session.mistake_count}/{session.total_count} 正确 · {session.score} 分
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
