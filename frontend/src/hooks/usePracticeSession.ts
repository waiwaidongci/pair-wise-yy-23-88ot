import { useCallback, useEffect, useRef, useState } from "react";
import { usePracticeRunnerStore, type Submission } from "../stores/PracticeRunnerStore";
import type { PracticeSession } from "../types/PracticeSession";

// 练习会话 facade：为练习页提供计时、提交后的自动落库
export function usePracticeSession() {
  const status = usePracticeRunnerStore((state) => state.status);
  const index = usePracticeRunnerStore((state) => state.index);
  const total = usePracticeRunnerStore((state) => state.questions.length);
  const question = usePracticeRunnerStore((state) => state.questions[state.index]);
  const questions = usePracticeRunnerStore((state) => state.questions);
  const lastSubmission = usePracticeRunnerStore((state) => state.lastSubmission);
  const submissions = usePracticeRunnerStore((state) => state.submissions);
  const finishedSession = usePracticeRunnerStore((state) => state.finishedSession);
  const startedAt = usePracticeRunnerStore((state) => state.startedAt);
  const submitRunner = usePracticeRunnerStore((state) => state.submit);
  const next = usePracticeRunnerStore((state) => state.next);
  const finish = usePracticeRunnerStore((state) => state.finish);
  const start = usePracticeRunnerStore((state) => state.start);
  const reset = usePracticeRunnerStore((state) => state.reset);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "RUNNING") {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    const base = new Date(startedAt).getTime();
    timerRef.current = window.setInterval(() => setElapsedMs(Date.now() - base), 250);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [status, startedAt]);

  const submit = useCallback(
    (userAnswer: string): Submission => submitRunner(userAnswer),
    [submitRunner]
  );

  // 答完最后一题进入 FINISHED 时自动把会话与答题记录写入本机库
  useEffect(() => {
    if (status !== "FINISHED" || finishedSession || saving) return;
    setSaving(true);
    finish()
      .catch((error) => console.error("保存练习结果失败", error))
      .finally(() => setSaving(false));
  }, [status, finishedSession, saving, finish]);

  return {
    status,
    index,
    total,
    question,
    questions,
    lastSubmission,
    submissions,
    finishedSession,
    elapsedMs,
    saving,
    start,
    submit,
    next,
    reset
  };
}
