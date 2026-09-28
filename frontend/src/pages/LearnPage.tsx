import { useMemo, useState } from "react";
import { BrailleCell } from "../components/common/BrailleCell";
import { StatusBadge } from "../components/common/StatusBadge";
import { EmptyState } from "../components/common/EmptyState";
import { StatCard } from "../components/common/StatCard";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useLessonStore } from "../stores/LessonStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { usePracticeLauncherStore } from "../stores/PracticeLauncherStore";
import { SymbolCategoryText } from "../constants/SymbolCategory";
import { masteryOf } from "../constants/MasteryLevel";
import { formatDots } from "../utils/formatters";
import type { BrailleSymbol } from "../types/BrailleSymbol";

const DIFFICULTY_ALL = 0;

/**
 * 学习卡片页：按课程查看点阵卡片，可按难度切换；
 * 每张卡片展示点阵、字符、点位编号与由本机答题记录推导的掌握度，
 * 并可一键带着该课程的字符组跳转到练习模式。
 */
export function LearnPage() {
  const symbols = useBrailleSymbolStore((state) => state.rows);
  const lessons = useLessonStore((state) => state.rows);
  const records = useAnswerRecordStore((state) => state.rows);
  const launcher = usePracticeLauncherStore();

  const [lessonId, setLessonId] = useState<number>(lessons[0]?.id ?? 0);
  const [difficulty, setDifficulty] = useState<number>(DIFFICULTY_ALL);

  const effectiveLessonId = lessonId || lessons[0]?.id || 0;
  const activeLesson = lessons.find((lesson) => lesson.id === effectiveLessonId);

  const masteryMap = useMemo(() => {
    const map = new Map<number, { attempts: number; correct: number }>();
    records.forEach((record) => {
      const entry = map.get(record.symbol_id) ?? { attempts: 0, correct: 0 };
      entry.attempts += 1;
      if (record.correct) entry.correct += 1;
      map.set(record.symbol_id, entry);
    });
    return map;
  }, [records]);

  const lessonSymbols = useMemo(() => {
    const ids = new Set(activeLesson?.symbol_ids ?? []);
    return symbols
      .filter((symbol) => ids.has(symbol.id))
      .filter((symbol) => difficulty === DIFFICULTY_ALL || symbol.difficulty === difficulty)
      .sort((a, b) => a.id - b.id);
  }, [symbols, activeLesson, difficulty]);

  const difficulties = useMemo(
    () => Array.from(new Set(symbols.map((symbol) => symbol.difficulty))).sort((a, b) => a - b),
    [symbols]
  );

  const startPractice = () => {
    if (!activeLesson) return;
    launcher.launchLesson({ lessonId: activeLesson.id, mode: "CELL_TO_TEXT" });
    window.location.hash = "/practice";
  };

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">braille-trainer / learn</p>
          <h1>学习卡片</h1>
        </div>
        <StatusBadge value="LOCAL_DATA" />
      </section>

      <section className="metrics">
        <StatCard label="课程数" value={lessons.length} />
        <StatCard label="点字字符" value={symbols.length} />
        <StatCard label="已产生答题" value={records.length} />
      </section>

      {lessons.length === 0 ? (
        <EmptyState title="还没有课程" description="首次打开需要从种子数据写入课程，请稍后刷新页面。" />
      ) : (
        <>
          <section className="panel">
            <div className="filter-row">
              {lessons.map((lesson) => (
                <button
                  type="button"
                  key={lesson.id}
                  className={`choice${lesson.id === effectiveLessonId ? " selected" : ""}`}
                  onClick={() => setLessonId(lesson.id)}
                >
                  <strong>{lesson.title}</strong>
                  <small>{lesson.stage} · {lesson.symbol_ids.length} 字</small>
                </button>
              ))}
            </div>
            <div className="filter-row difficulty-row">
              <button
                type="button"
                className={`choice small${difficulty === DIFFICULTY_ALL ? " selected" : ""}`}
                onClick={() => setDifficulty(DIFFICULTY_ALL)}
              >
                全部难度
              </button>
              {difficulties.map((level) => (
                <button
                  type="button"
                  key={level}
                  className={`choice small${difficulty === level ? " selected" : ""}`}
                  onClick={() => setDifficulty(level)}
                >
                  难度 {level}
                </button>
              ))}
            </div>
            <div className="inline-actions">
              <button type="button" className="btn primary" onClick={startPractice}>
                练习本课字符（点阵识别）
              </button>
              <span className="muted">{activeLesson?.unlock_rule}</span>
            </div>
          </section>

          {lessonSymbols.length === 0 ? (
            <EmptyState title="该难度下暂无字符" description="切换其它难度查看点阵卡片。" />
          ) : (
            <section className="card-grid">
              {lessonSymbols.map((symbol) => (
                <SymbolCard
                  key={symbol.id}
                  symbol={symbol}
                  mastery={masteryMap.get(symbol.id) ?? { attempts: 0, correct: 0 }}
                />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}

function SymbolCard({ symbol, mastery }: { symbol: BrailleSymbol; mastery: { attempts: number; correct: number } }) {
  const level = masteryOf(mastery.attempts === 0 ? 0 : mastery.correct / mastery.attempts, mastery.attempts);
  return (
    <article className="panel symbol-card">
      <div className="symbol-card-head">
        <span className="big-letter">{symbol.letter}</span>
        <StatusBadge value={symbol.category} kind="SymbolCategory" />
      </div>
      <BrailleCell pattern={symbol.cell_pattern} size="md" label={symbol.letter} />
      <div className="symbol-card-meta">
        <p>{symbol.pinyin}</p>
        <p className="muted">点位 {formatDots(symbol.cell_pattern)} · 难度 {symbol.difficulty}</p>
        <p className="muted">
          {SymbolCategoryText[symbol.category]} · 掌握度：
          <StatusBadge value={level} kind="MasteryLevel" />
          {mastery.attempts > 0 ? `（${mastery.attempts} 次作答）` : "（未练习）"}
        </p>
      </div>
    </article>
  );
}
