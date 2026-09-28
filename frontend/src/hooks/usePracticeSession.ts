import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { PracticeSession } from "../types/PracticeSession";
import type { PracticeMode } from "../constants/PracticeMode";
import {
  buildQuestions,
  gradeChoice,
  gradeDots,
  type GradeResult,
  type PracticeQuestion
} from "../utils/practice";
import {
  completePracticeSession,
  startPracticeSession,
  type SubmittedAnswer
} from "../services/practiceService";
import { markMistakeResolved } from "../services/mistakeService";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";

export type PracticePhase = "loading" | "running" | "finished";

export interface QuestionFeedback {
  grade: GradeResult;
  latencyMs: number;
}

interface UsePracticeSessionParams {
  /** 每次发起练习的唯一 key，变化即重新生成题组并重建会话。 */
  sessionKey: number;
  pool: BrailleSymbol[];
  mode: PracticeMode;
  /** 0 表示错题复习（答对后消化错题本记录）；非 0 为课程练习。 */
  lessonId: number;
}

/**
 * 一次练习会话的状态机：loading（建会话/出题）→ running（逐题即时反馈）→ finished（落库）。
 * 单题计时在题目展示时开始，提交即得到对错与用时；
 * 全部作答完成后会话与答题记录一次性写入 IndexedDB，刷新/离开再回来仍可在进度页查看。
 */
export function usePracticeSession({
  sessionKey,
  pool,
  mode,
  lessonId
}: UsePracticeSessionParams) {
  const [phase, phaseSet] = useState<PracticePhase>("loading");
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [answers, setAnswers] = useState<SubmittedAnswer[]>([]);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const questionStartedAt = useRef<number>(0);
  const sessionStore = usePracticeSessionStore();
  const recordStore = useAnswerRecordStore();

  useEffect(() => {
    let cancelled = false;
    phaseSet("loading");
    setError(null);
    setFeedback(null);
    setAnswers([]);
    setIndex(0);

    if (pool.length === 0) {
      setError("本组字符为空，没有可练习的题目");
      phaseSet("finished");
      setQuestions([]);
      setSession(null);
      return () => {
        cancelled = true;
      };
    }

    const built = buildQuestions(pool, mode);
    startPracticeSession(lessonId, mode)
      .then((created) => {
        if (cancelled) return;
        setSession(created);
        setQuestions(built);
        questionStartedAt.current = Date.now();
        phaseSet("running");
      })
      .catch((cause: Error) => {
        if (cancelled) return;
        setError(cause.message);
        phaseSet("finished");
      });

    return () => {
      cancelled = true;
    };
    // sessionKey 才是重练信号；pool/mode 由发起页保证与 key 同步变化。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  const currentQuestion = questions[index] ?? null;

  const submit = useCallback(
    (picked: BrailleSymbol | undefined, selectedDots: number[]): QuestionFeedback | null => {
      if (!currentQuestion || feedback) return null;
      const latencyMs = Math.max(0, Date.now() - questionStartedAt.current);
      const grade =
        currentQuestion.kind === "TEXT_TO_CELL"
          ? gradeDots(selectedDots, currentQuestion.symbol)
          : gradeChoice(picked, currentQuestion.symbol);
      const result = { grade, latencyMs };
      setFeedback(result);
      setAnswers((current) => [...current, { question: currentQuestion, ...result }]);
      return result;
    },
    [currentQuestion, feedback]
  );

  const finish = useCallback(async () => {
    if (!session) return;
    const completed = await completePracticeSession(session, answers);
    sessionStore.upsert(completed.session);
    // 先刷新本机记录，再用最新记录消化错题，避免与并发写入竞态。
    await recordStore.load(true);

    // 错题复习：本次答对的字符，消化错题本中最早一条未消化记录。
    if (lessonId === 0) {
      const correctSymbolIds = new Set(
        answers.filter((item) => item.grade.correct).map((item) => item.question.symbol.id)
      );
      await Promise.all(
        Array.from(correctSymbolIds).map(async (symbolId) => {
          const resolved = await markMistakeResolved(recordStore.rows, symbolId);
          if (resolved) recordStore.replace(resolved);
        })
      );
    }
    phaseSet("finished");
  }, [session, answers, lessonId, sessionStore, recordStore]);

  const next = useCallback(async () => {
    if (index + 1 >= questions.length) {
      await finish();
      return;
    }
    setIndex((current) => current + 1);
    setFeedback(null);
    questionStartedAt.current = Date.now();
  }, [index, questions.length, finish]);

  const correctCount = useMemo(() => answers.filter((item) => item.grade.correct).length, [answers]);

  return {
    phase,
    error,
    questions,
    index,
    currentQuestion,
    feedback,
    answers,
    session,
    correctCount,
    submit,
    next
  };
}
