import { useEffect, useMemo, useState } from "react";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { EmptyState } from "../components/common/EmptyState";
import { PracticeRunner } from "../components/practice/PracticeRunner";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useLessonStore } from "../stores/LessonStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { usePracticeLauncherStore } from "../stores/PracticeLauncherStore";
import { PRACTICE_MODE_OPTIONS, type PracticeMode } from "../constants/PracticeMode";
import { formatLatency } from "../utils/formatters";

/**
 * 练习模式页：
 * 1) 从课程中挑一组字符，选择题型（点阵识别 / 文字选点 / 听写 / 混合）；
 * 2) 逐题提交，即时看到对错与用时；
 * 3) 结束后会话与答题记录落到 IndexedDB，错题自动进入错题本。
 * 也接收学习卡片、错题本通过 PracticeLauncherStore 发起的练习。
 */
export function PracticePage() {
  const lessons = useLessonStore((state) => state.rows);
  const symbols = useBrailleSymbolStore((state) => state.rows);
  const launcher = usePracticeLauncherStore();

  const [lessonId, setLessonId] = useState<number>(lessons[0]?.id ?? 1);
  const [mode, setMode] = useState<PracticeMode>("CELL_TO_TEXT");
  const [running, setRunning] = useState(false);

  // 由学习卡片/错题本跨页发起：挂载时消费 pending 标记进入练习；
  // 页内挂载期间产生的 nonce 变化同样进入练习。
  // 离开练习页后再回来（pending 已清除）展示配置页，不自动续练。
  useEffect(() => {
    if (usePracticeLauncherStore.getState().pending) {
      usePracticeLauncherStore.getState().consumePending();
      setRunning(true);
    }
    const unsubscribe = usePracticeLauncherStore.subscribe((state, previous) => {
      if (state.nonce !== previous.nonce) setRunning(true);
    });
    return unsubscribe;
  }, []);

  const activeLessonId = running ? launcher.lessonId : lessonId;
  const activeLesson = lessons.find((lesson) => lesson.id === activeLessonId);

  const lessonPool = useMemo(() => {
    if (running && launcher.symbolIds) {
      const ids = new Set(launcher.symbolIds);
      return symbols.filter((symbol) => ids.has(symbol.id));
    }
    const ids = new Set(activeLesson?.symbol_ids ?? []);
    return symbols.filter((symbol) => ids.has(symbol.id));
  }, [running, launcher.symbolIds, symbols, activeLesson]);

  // 由其它页面发起（launcher.nonce 变化）时直接进入练习。
  const launched = launcher.nonce > 0 && running;

  const startConfigured = () => {
    launcher.launchLesson({ lessonId, mode });
    setRunning(true);
  };

  const exit = () => {
    setRunning(false);
    launcher.clear();
  };

  // 再来一组：沿用当前课程/错题题源与题型，仅提升 nonce 重新出题。
  const retry = () => {
    if (launcher.lessonId === 0) {
      launcher.launchReview({
        symbolIds: launcher.symbolIds ?? [],
        mode: launcher.mode,
        reasonLabel: launcher.reasonLabel ?? undefined
      });
    } else {
      launcher.launchLesson({ lessonId: launcher.lessonId, mode: launcher.mode });
    }
  };

  const title = launched && launcher.lessonId === 0
    ? `错题复习${launcher.reasonLabel ? ` · ${launcher.reasonLabel}` : ""}`
    : `练习 · ${activeLesson?.title ?? "课程"}`;

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">braille-trainer / practice</p>
          <h1>练习模式</h1>
        </div>
        <StatusBadge value="LOCAL_DATA" />
      </section>

      {running && launcher.nonce > 0 ? (
        <PracticeRunner
          sessionKey={launcher.nonce}
          pool={lessonPool}
          mode={launcher.mode}
          lessonId={launcher.lessonId}
          title={title}
          onRetry={retry}
          onExit={exit}
        />
      ) : (
        <SetupView
          lessons={lessons}
          lessonId={lessonId}
          setLessonId={setLessonId}
          mode={mode}
          setMode={setMode}
          poolSize={lessonPool.length}
          onStart={startConfigured}
        />
      )}
    </main>
  );
}

interface SetupViewProps {
  lessons: import("../types/Lesson").Lesson[];
  lessonId: number;
  setLessonId: (id: number) => void;
  mode: PracticeMode;
  setMode: (mode: PracticeMode) => void;
  poolSize: number;
  onStart: () => void;
}

function SetupView({ lessons, lessonId, setLessonId, mode, setMode, poolSize, onStart }: SetupViewProps) {
  const sessionCount = useAnswerRecordStore((state) => new Set(state.rows.map((row) => row.session_id)).size);
  const records = useAnswerRecordStore((state) => state.rows);
  const avgLatency = records.length
    ? Math.round(records.reduce((sum, row) => sum + row.latency_ms, 0) / records.length)
    : 0;

  return (
    <>
      <section className="metrics">
        <StatCard label="可练课程" value={lessons.length} />
        <StatCard label="本组字符" value={poolSize} />
        <StatCard label="历史平均用时" value={records.length ? formatLatency(avgLatency) : "暂无"} />
      </section>

      {lessons.length === 0 ? (
        <EmptyState
          title="课程数据尚未就绪"
          description="首次打开需要写入本机课程，请稍后刷新页面。"
        />
      ) : (
        <section className="panel setup-panel">
          <h2>第一步 · 选择课程字符组</h2>
          <div className="filter-row">
            {lessons.map((lesson) => (
              <button
                type="button"
                key={lesson.id}
                className={`choice${lesson.id === lessonId ? " selected" : ""}`}
                onClick={() => setLessonId(lesson.id)}
              >
                <strong>{lesson.title}</strong>
                <small>{lesson.stage} · {lesson.symbol_ids.length} 个字符 · 约 {lesson.estimated_minutes} 分钟</small>
              </button>
            ))}
          </div>

          <h2>第二步 · 选择题型</h2>
          <div className="filter-row">
            {PRACTICE_MODE_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`choice${option.value === mode ? " selected" : ""}`}
                onClick={() => setMode(option.value)}
              >
                <strong>{option.label}</strong>
              </button>
            ))}
          </div>

          <div className="inline-actions setup-actions">
            <button type="button" className="btn primary" disabled={poolSize === 0} onClick={onStart}>
              开始练习（{poolSize} 题以内，随机抽取）
            </button>
          </div>
          <p className="muted">已完成 {sessionCount} 次练习；提交后即时判题，错题自动收入错题本。</p>
        </section>
      )}
    </>
  );
}
