import { useMemo, useState } from "react";
import { BrailleCell } from "../components/common/BrailleCell";
import { ResultBadge } from "../components/common/ResultBadge";
import { StatusBadge } from "../components/common/StatusBadge";
import { EmptyState } from "../components/common/EmptyState";
import { StatCard } from "../components/common/StatCard";
import { PracticeRunner } from "../components/practice/PracticeRunner";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { MISTAKE_REASON_OPTIONS, type MistakeReason } from "../constants/MistakeReason";
import { PRACTICE_MODE_OPTIONS, type PracticeMode } from "../constants/PracticeMode";
import { selectMistakeRows, selectMistakeSymbols, type MistakeFilter } from "../services/mistakeService";
import { summarizeMistakes } from "../utils/practiceStats";
import { formatDate, formatDots, formatLatency } from "../utils/formatters";
import type { BrailleSymbol } from "../types/BrailleSymbol";

interface ReviewRequest {
  nonce: number;
  symbols: BrailleSymbol[];
  mode: PracticeMode;
  reasonLabel: string | null;
}

/**
 * 错题本：
 * - 答错的条目（未消化）自动汇集于此，可按错误原因筛选；
 * - 单条"重答此题"或整组"按筛选条件重新练习"；
 * - 复习时重新答对的字符会把最早一条未消化记录标记为已掌握并从列表消失；
 * - 无错题时给出空状态。全部数据来自本机 IndexedDB。
 */
export function MistakesPage() {
  const records = useAnswerRecordStore((state) => state.rows);
  const symbols = useBrailleSymbolStore((state) => state.rows);
  const sessions = usePracticeSessionStore((state) => state.rows);

  const [reason, setReason] = useState<MistakeFilter>("ALL");
  const [mode, setMode] = useState<PracticeMode>("CELL_TO_TEXT");
  const [review, setReview] = useState<ReviewRequest | null>(null);
  const [nonceSeed, setNonceSeed] = useState(0);

  const summary = useMemo(() => summarizeMistakes(records), [records]);
  const rows = useMemo(() => selectMistakeRows(records, symbols, reason), [records, symbols, reason]);
  const sessionMap = useMemo(() => new Map(sessions.map((session) => [session.id, session])), [sessions]);

  const launchReview = (reviewSymbols: BrailleSymbol[], reasonLabel: string | null) => {
    const nextNonce = nonceSeed + 1;
    setNonceSeed(nextNonce);
    setReview({ nonce: nextNonce, symbols: reviewSymbols, mode, reasonLabel });
  };

  if (review) {
    return (
      <main className="page">
        <section className="page-head">
          <div>
            <p className="eyebrow">braille-trainer / mistakes review</p>
            <h1>错题重答</h1>
          </div>
          <StatusBadge value="REVIEW" />
        </section>
        <PracticeRunner
          sessionKey={review.nonce}
          pool={review.symbols}
          mode={review.mode}
          lessonId={0}
          title={review.reasonLabel ? `错题复习 · ${review.reasonLabel}` : "错题复习"}
          onRetry={() => launchReview(review.symbols, review.reasonLabel)}
          onExit={() => setReview(null)}
        />
      </main>
    );
  }

  const reviewSymbols = selectMistakeSymbols(rows);

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">braille-trainer / mistakes</p>
          <h1>错题本</h1>
        </div>
        <StatusBadge value="LOCAL_DATA" />
      </section>

      <section className="metrics">
        <StatCard label="累计错题" value={summary.total} />
        <StatCard label="待消化" value={summary.unresolved} />
        <StatCard label="当前筛选" value={rows.length} />
      </section>

      <section className="panel">
        <h2>按错误原因筛选</h2>
        <div className="filter-row">
          <button
            type="button"
            className={`choice small${reason === "ALL" ? " selected" : ""}`}
            onClick={() => setReason("ALL")}
          >
            全部原因
          </button>
          {MISTAKE_REASON_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`choice small${reason === option.value ? " selected" : ""}`}
              onClick={() => setReason(option.value)}
            >
              {option.label}
              <span className="choice-count">{summary.byReason[option.value] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="muted">复习题型：</span>
          {PRACTICE_MODE_OPTIONS.filter((option) => option.value !== "MIXED").map((option) => (
            <button
              type="button"
              key={option.value}
              className={`choice small${option.value === mode ? " selected" : ""}`}
              onClick={() => setMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {rows.length > 0 && (
          <div className="inline-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                launchReview(reviewSymbols, reason === "ALL" ? null : reasonLabelOf(reason))
              }
            >
              重新练习当前 {reviewSymbols.length} 个错题字符
            </button>
          </div>
        )}
      </section>

      {summary.unresolved === 0 ? (
        <EmptyState
          title="错题本还是空的"
          description="去练习模式完成一组练习，答错的字符会自动收录到这里，方便按原因重练。"
          action={
            <button type="button" className="btn primary" onClick={() => (window.location.hash = "/practice")}>
              去练习
            </button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState title="该原因下没有错题" description="切换其它错误原因查看。" />
      ) : (
        <section className="panel">
          <ul className="mistake-list">
            {rows.map(({ record, symbol }) => (
              <li key={record.id} className="mistake-row">
                {symbol ? <BrailleCell pattern={symbol.cell_pattern} size="sm" label={symbol.letter} /> : <span className="muted">字符已删除</span>}
                <div className="mistake-info">
                  <strong>{symbol?.letter ?? `#${record.symbol_id}`}</strong>
                  {symbol ? <span className="muted">{symbol.pinyin} · 点位 {formatDots(symbol.cell_pattern)}</span> : null}
                  <span className="muted">
                    你的答案：{record.user_answer || "未作答"} · 用时 {formatLatency(record.latency_ms)}
                    {sessionMap.get(record.session_id)
                      ? ` · ${formatDate(sessionMap.get(record.session_id)!.started_at)}`
                      : ""}
                  </span>
                </div>
                <ResultBadge correct={false} reason={record.mistake_reason || undefined} />
                <button
                  type="button"
                  className="btn"
                  disabled={!symbol}
                  onClick={() => symbol && launchReview([symbol], reasonLabelOf(record.mistake_reason))}
                >
                  重答此题
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function reasonLabelOf(reason: MistakeReason | string): string {
  return MISTAKE_REASON_OPTIONS.find((option) => option.value === reason)?.label ?? reason;
}
