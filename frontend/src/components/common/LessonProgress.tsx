import { formatPercent } from "../../utils/formatters";

interface LessonProgressProps {
  title: string;
  current: number;
  total: number;
  correct?: number;
  compact?: boolean;
}

export function LessonProgress({ title, current, total, correct, compact }: LessonProgressProps) {
  const percent = total ? Math.round((current / total) * 100) : 0;
  return (
    <div className={`lesson-progress ${compact ? "compact" : ""}`}>
      <div className="lesson-progress-head">
        <strong>{title}</strong>
        <span>
          {current}/{total}
          {correct !== undefined ? ` · 正确率 ${formatPercent(correct, total)}` : ` · ${percent}%`}
        </span>
      </div>
      <div className="lesson-progress-track">
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
