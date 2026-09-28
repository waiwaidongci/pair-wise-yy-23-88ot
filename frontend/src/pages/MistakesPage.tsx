import { useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { BrailleCell } from "../components/common/BrailleCell";
import { EmptyState } from "../components/common/EmptyState";
import { useIndexedDbStore } from "../hooks/useIndexedDbStore";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import {
  markRecordsResolved,
  selectOpenMistakes,
  summarizeReasons,
  type MistakeFilter
} from "../services/mistakeService";
import { type MistakeReason } from "../constants/MistakeReason";
import { formatDate, formatLatency, formatMistakeReason } from "../utils/formatters";
import { logWrite } from "../utils/logger";

interface MistakesPageProps {
  onRehearse: (symbolIds: number[], reason: MistakeReason | "ALL") => void;
}

export function MistakesPage({ onRehearse }: MistakesPageProps) {
  const symbolStore = useBrailleSymbolStore();
  const answerStore = useAnswerRecordStore();
  useIndexedDbStore([symbolStore, answerStore]);

  const [filter, setFilter] = useState<MistakeFilter>({ reason: "ALL", keyword: "" });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const reasonSummary = useMemo(() => summarizeReasons(answerStore.rows), [answerStore.rows]);
  const mistakes = useMemo(
    () => selectOpenMistakes(answerStore.rows, symbolStore.rows, filter),
    [answerStore.rows, symbolStore.rows, filter]
  );

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));

  const markMastered = async (ids: number[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    const nextRows = markRecordsResolved(answerStore.rows, ids, new Date().toISOString());
    const changed = nextRows.filter((row) => idSet.has(row.id));
    logWrite("AnswerRecord", "RESOLVE", { ids: ids.join(",") });
    await answerStore.updateMany(changed);
    setSelectedIds((prev) => prev.filter((id) => !idSet.has(id)));
  };

  return (
    <main className="page">
      <PageHeader
        title="错题本"
        description="答错的字符会自动收录；按错误原因筛选后可重新作答，答对即移出错题本。"
      />

      {reasonSummary[0]?.count === 0 ? (
        <EmptyState
          title="还没有错题"
          description="完成一次练习后，答错的条目会出现在这里。"
        />
      ) : (
        <>
          <section className="panel filter-panel">
            <div className="filter-group">
              <span className="filter-label">错误原因</span>
              <div className="chip-row wrap">
                {reasonSummary.map((item) => (
                  <button
                    type="button"
                    key={item.reason}
                    className={`chip ${filter.reason === item.reason ? "active" : ""}`}
                    onClick={() => setFilter((prev) => ({ ...prev, reason: item.reason }))}
                  >
                    {item.label}
                    <em>{item.count}</em>
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label">搜索</span>
              <input
                className="text-input"
                placeholder="输入字符或读音，如 a、逗号"
                value={filter.keyword}
                onChange={(event) => setFilter((prev) => ({ ...prev, keyword: event.target.value }))}
              />
            </div>
            <div className="filter-actions">
              <button
                type="button"
                className="btn primary"
                disabled={mistakes.length === 0}
                onClick={() => onRehearse(mistakes.map((entry) => entry.symbol.id), filter.reason)}
              >
                重新作答当前筛选（{mistakes.length}）
              </button>
              <button
                type="button"
                className="btn"
                disabled={selectedIds.length === 0}
                onClick={() => markMastered(selectedIds)}
              >
                标记选中为已掌握
              </button>
            </div>
          </section>

          {mistakes.length === 0 ? (
            <EmptyState title="该筛选下没有错题" description="清除原因筛选或搜索关键词后再看。" />
          ) : (
            <section className="panel">
              <ul className="mistake-list">
                {mistakes.map(({ record, symbol }) => (
                  <li key={record.id} className="mistake-row">
                    <label className="mistake-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => toggleSelect(record.id)}
                      />
                    </label>
                    <BrailleCell size={72} pattern={symbol.cell_pattern} label={symbol.letter} />
                    <div className="review-main">
                      <strong>{symbol.letter}</strong>
                      <p className="muted">
                        {symbol.pinyin} · 正确点位 {symbol.cell_pattern}
                      </p>
                      <p className="muted">
                        你的回答：{record.user_answer || "—"} · 用时 {formatLatency(record.latency_ms)} ·{" "}
                        {formatDate(record.created_at)}
                      </p>
                    </div>
                    <span className={`reason-tag ${String(record.mistake_reason).toLowerCase()}`}>
                      {formatMistakeReason(record.mistake_reason)}
                    </span>
                    <button type="button" className="btn small" onClick={() => markMastered([record.id])}>
                      已掌握
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
