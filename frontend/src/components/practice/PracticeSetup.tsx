import { useEffect, useMemo, useState } from "react";
import type { Lesson } from "../../types/Lesson";
import type { BrailleSymbol } from "../../types/BrailleSymbol";
import type { PracticeMode } from "../../constants/PracticeMode";
import { PracticeMode as PracticeModes, PracticeModeText } from "../../constants/PracticeMode";
import { MistakeReason, MistakeReasonText } from "../../constants/MistakeReason";
import { EmptyState } from "../common/EmptyState";

export interface RehearsalSource {
  symbolIds: number[];
  reason: MistakeReason | "ALL";
}

interface PracticeSetupProps {
  lessons: Lesson[];
  symbols: BrailleSymbol[];
  rehearsal?: RehearsalSource | null;
  onStart: (params: { lessonId: number; mode: PracticeMode; symbols: BrailleSymbol[] }) => void;
  onDismissRehearsal?: () => void;
}

export function PracticeSetup({ lessons, symbols, rehearsal, onStart, onDismissRehearsal }: PracticeSetupProps) {
  const selectableLessons = useMemo(
    () =>
      lessons
        .map((lesson) => ({
          lesson,
          symbols: lesson.symbol_ids
            .map((id) => symbols.find((symbol) => symbol.id === id))
            .filter((symbol): symbol is BrailleSymbol => Boolean(symbol))
        }))
        .filter((entry) => entry.symbols.length > 0),
    [lessons, symbols]
  );

  const rehearsalSymbols = useMemo(() => {
    if (!rehearsal) return [];
    const idSet = new Set(rehearsal.symbolIds);
    return symbols.filter((symbol) => idSet.has(symbol.id));
  }, [rehearsal, symbols]);

  const [lessonId, setLessonId] = useState<number>(0);
  const [lessonMode, setLessonMode] = useState<PracticeMode>("CELL_TO_TEXT");
  const [rehearsalMode, setRehearsalMode] = useState<PracticeMode>("MIXED");

  useEffect(() => {
    if (rehearsal) setRehearsalMode("MIXED");
  }, [rehearsal]);

  // 课程为异步加载：未选择或所选课程已失效时，回退到第一门可练习课程
  const effectiveLessonId = selectableLessons.some((entry) => entry.lesson.id === lessonId)
    ? lessonId
    : selectableLessons[0]?.lesson.id ?? 0;
  const selected = selectableLessons.find((entry) => entry.lesson.id === effectiveLessonId);

  return (
    <section className={`panel practice-setup ${rehearsal ? "rehearsal-banner" : ""}`}>
      {rehearsal ? (
        <>
          <h2>错题重新作答</h2>
          <p className="muted">
            来自错题本{rehearsal.reason !== "ALL" ? `（${MistakeReasonText[rehearsal.reason]}）` : ""}
            ，共 {rehearsalSymbols.length} 个字符；默认混合出题，答对后自动移出错题本。
          </p>
          {rehearsalSymbols.length === 0 ? (
            <EmptyState title="这些错题对应的字符已不存在" description="可以回到错题本刷新列表。" />
          ) : (
            <div className="setup-summary">
              <div className="rehearsal-preview">
                {rehearsalSymbols.map((symbol) => (
                  <span key={symbol.id} className="chip static">
                    {symbol.letter}
                  </span>
                ))}
              </div>
              <div className="filter-group">
                <span className="filter-label">出题方式</span>
                <ModeChips mode={rehearsalMode} onChange={setRehearsalMode} />
              </div>
              <div className="summary-actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => onStart({ lessonId: 0, mode: rehearsalMode, symbols: rehearsalSymbols })}
                >
                  开始错题重练
                </button>
                <button type="button" className="btn" onClick={onDismissRehearsal}>
                  取消，改为按课程练习
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <h2>开始一组练习</h2>
          <p className="muted">从课程中挑选一组字符，提交后立即看到对错与用时；答错的条目会进入错题本。</p>
          {selectableLessons.length === 0 ? (
            <EmptyState title="还没有可练习的课程" description="请先确认本机课程与字符数据已加载。" />
          ) : (
            <>
              <div className="filter-group">
                <span className="filter-label">选择课程</span>
                <div className="chip-row wrap">
                  {selectableLessons.map(({ lesson, symbols: lessonSymbols }) => (
                    <button
                      type="button"
                      key={lesson.id}
                      className={`chip ${effectiveLessonId === lesson.id ? "active" : ""}`}
                      onClick={() => setLessonId(lesson.id)}
                    >
                      {lesson.title}
                      <em>{lessonSymbols.length} 字</em>
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">练习方式</span>
                <ModeChips mode={lessonMode} onChange={setLessonMode} />
              </div>
              <div className="setup-summary">
                {selected && (
                  <p>
                    将练习 <strong>{selected.lesson.title}</strong> 的 {selected.symbols.length} 个字符，顺序随机。
                  </p>
                )}
                <button
                  type="button"
                  className="btn primary"
                  disabled={!selected}
                  onClick={() => selected && onStart({ lessonId: effectiveLessonId, mode: lessonMode, symbols: selected.symbols })}
                >
                  开始练习
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

function ModeChips({ mode, onChange }: { mode: PracticeMode; onChange: (value: PracticeMode) => void }) {
  return (
    <div className="chip-row wrap">
      {PracticeModes.map((value) => (
        <button type="button" key={value} className={`chip ${mode === value ? "active" : ""}`} onClick={() => onChange(value)}>
          {PracticeModeText[value]}
        </button>
      ))}
    </div>
  );
}
