import { useMemo } from "react";
import { PageHeader } from "../components/PageHeader";
import { useIndexedDbStore } from "../hooks/useIndexedDbStore";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useLessonStore } from "../stores/LessonStore";
import { useMistakeRehearsalStore } from "../stores/MistakeRehearsalStore";
import { PracticeSetup, type RehearsalSource } from "../components/practice/PracticeSetup";
import { PracticeQuestionCard } from "../components/practice/PracticeQuestionCard";
import { PracticeSummary } from "../components/practice/PracticeSummary";
import { formatLatency } from "../utils/formatters";

export function PracticePage() {
  const symbolStore = useBrailleSymbolStore();
  const lessonStore = useLessonStore();
  const rehearsalStore = useMistakeRehearsalStore();
  useIndexedDbStore([symbolStore, lessonStore]);

  const runner = usePracticeSession();

  const rehearsal: RehearsalSource | null = useMemo(
    () =>
      rehearsalStore.pendingSymbolIds.length
        ? { symbolIds: rehearsalStore.pendingSymbolIds, reason: rehearsalStore.sourceReason }
        : null,
    [rehearsalStore.pendingSymbolIds, rehearsalStore.sourceReason]
  );

  return (
    <main className="page">
      <PageHeader
        title="练习模式"
        description="看点阵识别文字、看文字选择点位，提交即判分，结果自动保存在本机。"
      />

      {runner.status === "IDLE" && (
        <PracticeSetup
          lessons={lessonStore.rows}
          symbols={symbolStore.rows}
          rehearsal={rehearsal}
          onStart={({ lessonId, mode, symbols }) => {
            runner.start({ lessonId, mode, symbols });
            rehearsalStore.clear();
          }}
          onDismissRehearsal={() => rehearsalStore.clear()}
        />
      )}

      {runner.status === "RUNNING" && runner.question && (
        <>
          <PracticeQuestionCard
            question={runner.question}
            index={runner.index}
            total={runner.total}
            correctCount={runner.submissions.filter((item) => item.correct).length}
            elapsedMs={runner.elapsedMs}
            lastSubmission={runner.lastSubmission}
            onSubmit={runner.submit}
            onNext={runner.next}
          />
          <p className="muted center-tip">本组已用时 {formatLatency(runner.elapsedMs)}</p>
        </>
      )}

      {runner.status === "FINISHED" && (
        <PracticeSummary
          session={runner.finishedSession}
          submissions={runner.submissions}
          saving={runner.saving || !runner.finishedSession}
          onRetry={() => runner.reset()}
          onBackToSetup={() => runner.reset()}
        />
      )}
    </main>
  );
}
