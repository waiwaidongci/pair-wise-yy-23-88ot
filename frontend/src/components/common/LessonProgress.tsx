import { formatPercent } from "../../utils/formatters";

interface LessonProgressProps {
  /** 0-1。 */
  accuracy: number;
  correctCount: number;
  totalCount: number;
  compact?: boolean;
}

/** 课程进度条：进度页课程行与练习结算共用。 */
export function LessonProgress({ accuracy, correctCount, totalCount, compact = false }: LessonProgressProps) {
  const percent = Math.round(accuracy * 100);
  return (
    <div className="lesson-progress" aria-label={`正确率 ${percent}%`}>
      <div className="lesson-progress-bar">
        <span className={percent >= 70 ? "good" : percent >= 40 ? "mid" : "low"} style={{ width: `${percent}%` }} />
      </div>
      {!compact ? (
        <span className="lesson-progress-meta">
          {correctCount}/{totalCount} · {formatPercent(accuracy)}
        </span>
      ) : null}
    </div>
  );
}
