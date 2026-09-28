import { useMemo } from "react";
import type { PracticeSession } from "../../types/PracticeSession";
import type { Submission } from "../../stores/PracticeRunnerStore";
import { BrailleCell } from "../common/BrailleCell";
import { ResultBadge } from "../common/ResultBadge";
import { PracticePanel } from "../common/PracticePanel";
import { StatCard } from "../common/StatCard";
import { MistakeReasonText } from "../../constants/MistakeReason";
import { formatDuration, formatLatency, formatPercent } from "../../utils/formatters";
import { parseDots } from "../../utils/brailleDots";

interface PracticeSummaryProps {
  session: PracticeSession | null;
  submissions: Submission[];
  saving: boolean;
  onRetry: () => void;
  onBackToSetup: () => void;
}

export function PracticeSummary({ session, submissions, saving, onRetry, onBackToSetup }: PracticeSummaryProps) {
  const correctCount = submissions.filter((item) => item.correct).length;
  const totalLatency = submissions.reduce((sum, item) => sum + item.latencyMs, 0);
  const durationMs = useMemo(() => {
    if (!session?.finished_at) return totalLatency;
    return new Date(session.finished_at).getTime() - new Date(session.started_at).getTime();
  }, [session, totalLatency]);

  return (
    <div className="summary-stack">
      <PracticePanel title={saving ? "正在保存练习结果…" : "本次练习结果"}>
        <section className="metrics">
          <StatCard label="得分" value={session ? `${session.score}` : "—"} hint={`${correctCount}/${submissions.length} 题正确`} />
          <StatCard label="正确率" value={formatPercent(correctCount, submissions.length)} />
          <StatCard label="总用时" value={formatDuration(durationMs)} hint={`平均每题 ${formatLatency(Math.round(totalLatency / Math.max(1, submissions.length)))}`} />
        </section>
        <div className="summary-actions">
          <button type="button" className="btn primary" onClick={onRetry}>
            再来一组
          </button>
          <button type="button" className="btn" onClick={onBackToSetup}>
            返回设置
          </button>
        </div>
      </PracticePanel>

      <PracticePanel title="答题明细">
        <ul className="review-list">
          {submissions.map((submission, index) => (
            <li key={`${submission.question.symbol.id}-${index}`} className="review-row">
              <span className="review-index">{index + 1}</span>
              <BrailleCell
                size={64}
                pattern=""
                selected={
                  submission.question.promptMode === "TEXT_TO_CELL"
                    ? parseDots(submission.userAnswer)
                    : parseDots(submission.question.symbol.cell_pattern)
                }
                target={
                  submission.question.promptMode === "TEXT_TO_CELL" && !submission.correct
                    ? parseDots(submission.question.symbol.cell_pattern)
                    : []
                }
                label={submission.question.symbol.letter}
              />
              <div className="review-main">
                <strong>{submission.question.symbol.letter}</strong>
                <p className="muted">
                  你的回答：{submission.userAnswer || "—"} · {formatLatency(submission.latencyMs)}
                  {!submission.correct &&
                    ` · ${MistakeReasonText[submission.mistakeReason as keyof typeof MistakeReasonText] ?? "字符认错"}`}
                </p>
              </div>
              <ResultBadge correct={submission.correct} />
            </li>
          ))}
        </ul>
      </PracticePanel>
    </div>
  );
}
