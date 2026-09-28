import { useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { BrailleCell } from "../components/common/BrailleCell";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge } from "../components/common/StatusBadge";
import { useIndexedDbStore } from "../hooks/useIndexedDbStore";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useLessonStore } from "../stores/LessonStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { buildSymbolMastery } from "../services/progressService";
import { DifficultyLevel, DifficultyLevelText } from "../constants/DifficultyLevel";
import { SymbolCategory, SymbolCategoryText } from "../constants/SymbolCategory";
import { MasteryLevel, MasteryLevelText } from "../constants/MasteryLevel";
import { formatDifficulty, formatSymbolCategory } from "../utils/formatters";
import { speak } from "../utils/speech";

export function LearnPage() {
  const symbolStore = useBrailleSymbolStore();
  const lessonStore = useLessonStore();
  const answerStore = useAnswerRecordStore();
  useIndexedDbStore([symbolStore, lessonStore, answerStore]);

  const [lessonId, setLessonId] = useState<number | "ALL">(1);
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "ALL">("ALL");
  const [category, setCategory] = useState<SymbolCategory | "ALL">("ALL");

  const masteryMap = useMemo(() => buildSymbolMastery(answerStore.rows), [answerStore.rows]);

  const symbols = useMemo(() => {
    const lesson = lessonStore.rows.find((row) => row.id === lessonId);
    const idSet = lesson ? new Set(lesson.symbol_ids) : null;
    return symbolStore.rows.filter((symbol) => {
      if (idSet && !idSet.has(symbol.id)) return false;
      if (difficulty !== "ALL" && symbol.difficulty !== difficulty) return false;
      if (category !== "ALL" && symbol.category !== category) return false;
      return true;
    });
  }, [symbolStore.rows, lessonStore.rows, lessonId, difficulty, category]);

  return (
    <main className="page">
      <PageHeader
        title="学习卡片"
        description="选择课程，按难度或类别切换，逐个认识盲文 6 点字符。"
      />

      <section className="panel filter-panel">
        <div className="filter-group">
          <span className="filter-label">课程</span>
          <div className="chip-row">
            <FilterChip active={lessonId === "ALL"} onClick={() => setLessonId("ALL")}>
              全部字符
            </FilterChip>
            {lessonStore.rows.map((lesson) => (
              <FilterChip key={lesson.id} active={lessonId === lesson.id} onClick={() => setLessonId(lesson.id)}>
                {lesson.title}
              </FilterChip>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">难度</span>
          <div className="chip-row">
            <FilterChip active={difficulty === "ALL"} onClick={() => setDifficulty("ALL")}>
              全部
            </FilterChip>
            {DifficultyLevel.map((value) => (
              <FilterChip key={value} active={difficulty === value} onClick={() => setDifficulty(value)}>
                {DifficultyLevelText[value]}
              </FilterChip>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">类别</span>
          <div className="chip-row">
            <FilterChip active={category === "ALL"} onClick={() => setCategory("ALL")}>
              全部
            </FilterChip>
            {SymbolCategory.map((value) => (
              <FilterChip key={value} active={category === value} onClick={() => setCategory(value)}>
                {SymbolCategoryText[value]}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      <section className="card-grid">
        {symbols.length === 0 ? (
          <EmptyState title="当前筛选下没有字符" description="换一个课程或清除筛选条件试试。" />
        ) : (
          symbols.map((symbol) => {
            const mastery: MasteryLevel = masteryMap.get(symbol.id)?.mastery ?? "NEW";
            return (
              <article key={symbol.id} className="panel symbol-card">
                <div className="symbol-card-cell">
                  <BrailleCell pattern={symbol.cell_pattern} label={symbol.letter} />
                </div>
                <div className="symbol-card-body">
                  <div className="symbol-card-title">
                    <strong>{symbol.letter}</strong>
                    <StatusBadge value={MasteryLevelText[mastery]} tone={masteryTone(mastery)} />
                  </div>
                  <p>{symbol.pinyin}</p>
                  <p className="muted">
                    {formatSymbolCategory(symbol.category)} · {formatDifficulty(symbol.difficulty)} · 点位 {symbol.cell_pattern || "—"}
                  </p>
                  <button type="button" className="btn small" onClick={() => speak(symbol.pinyin)}>
                    播放读音
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button type="button" className={`chip ${active ? "active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function masteryTone(mastery: MasteryLevel): "neutral" | "good" | "warn" | "bad" {
  if (mastery === "MASTERED") return "good";
  if (mastery === "FAMILIAR") return "good";
  if (mastery === "LEARNING") return "warn";
  return "neutral";
}
