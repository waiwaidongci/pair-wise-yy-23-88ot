import { create } from "zustand";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { PracticeMode } from "../constants/PracticeMode";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { PracticeSession } from "../types/PracticeSession";
import { buildQuestions, gradeAnswer, type PracticeQuestion } from "../services/gradingService";
import { resolveMistakeRecords } from "../services/mistakeService";
import { createStartedPracticeSession } from "../constructors/PracticeSessionConstructor";
import { createSubmittedAnswerRecord } from "../constructors/AnswerRecordConstructor";
import { nextId } from "../utils/collection";
import { logWrite } from "../utils/logger";
import { LocalDataError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { usePracticeSessionStore } from "./PracticeSessionStore";
import { useAnswerRecordStore } from "./AnswerRecordStore";
export type RunnerStatus = "IDLE" | "RUNNING" | "FINISHED";

export interface Submission {
  question: PracticeQuestion;
  userAnswer: string;
  correct: boolean;
  latencyMs: number;
  mistakeReason: string;
}

interface PracticeRunnerState {
  status: RunnerStatus;
  lessonId: number;
  mode: PracticeMode;
  questions: PracticeQuestion[];
  index: number;
  startedAt: string;
  questionStartedAt: number;
  sessionId: number;
  submissions: Submission[];
  lastSubmission: Submission | null;
  finishedSession: PracticeSession | null;
  start: (params: { lessonId: number; mode: PracticeMode; symbols: BrailleSymbol[] }) => void;
  submit: (userAnswer: string) => Submission;
  next: () => void;
  finish: () => Promise<PracticeSession>;
  reset: () => void;
}

const initialState = {
  status: "IDLE" as RunnerStatus,
  lessonId: 0,
  mode: "CELL_TO_TEXT" as PracticeMode,
  questions: [] as PracticeQuestion[],
  index: 0,
  startedAt: "",
  questionStartedAt: 0,
  sessionId: 0,
  submissions: [] as Submission[],
  lastSubmission: null as Submission | null,
  finishedSession: null as PracticeSession | null
};

export const usePracticeRunnerStore = create<PracticeRunnerState>((set, get) => ({
  ...initialState,

  start({ lessonId, mode, symbols }) {
    if (!symbols.length) throw new LocalDataError(ERROR_CODES.EMPTY_LESSON, `lesson ${lessonId}`);
    const questions = buildQuestions(symbols, mode);
    const startedAt = new Date().toISOString();
    const sessionId = nextId(usePracticeSessionStore.getState().rows);
    logWrite("PracticeRunner", "START", { lessonId, mode, questions: questions.length });
    set({
      status: "RUNNING",
      lessonId,
      mode,
      questions,
      index: 0,
      startedAt,
      questionStartedAt: Date.now(),
      sessionId,
      submissions: [],
      lastSubmission: null,
      finishedSession: null
    });
  },

  submit(userAnswer) {
    const state = get();
    const question = state.questions[state.index];
    if (!question) throw new LocalDataError(ERROR_CODES.ANSWER_GRADE_FAILED, `index ${state.index}`);
    const latencyMs = Math.max(0, Date.now() - state.questionStartedAt);
    const result = gradeAnswer(question, userAnswer);
    const submission: Submission = {
      question,
      userAnswer,
      correct: result.correct,
      latencyMs,
      mistakeReason: result.mistakeReason
    };
    logWrite("PracticeRunner", "SUBMIT", {
      index: state.index + 1,
      correct: result.correct,
      latency: latencyMs
    });
    set({
      submissions: [...state.submissions, submission],
      lastSubmission: submission
    });
    return submission;
  },

  next() {
    const state = get();
    if (state.index + 1 >= state.questions.length) {
      set({ status: "FINISHED" });
    } else {
      set({ index: state.index + 1, questionStartedAt: Date.now(), lastSubmission: null });
    }
  },

  async finish() {
    const state = get();
    if (state.status !== "FINISHED") {
      throw new LocalDataError(ERROR_CODES.SESSION_NOT_FOUND, `session ${state.sessionId}`);
    }
    if (state.finishedSession) return state.finishedSession;
    const finishedAt = new Date().toISOString();
    const correctCount = state.submissions.filter((item) => item.correct).length;
    const mistakeCount = state.submissions.length - correctCount;
    const score = state.submissions.length
      ? Math.round((correctCount / state.submissions.length) * 100)
      : 0;

    const draftSession = createStartedPracticeSession(state.sessionId, state.lessonId, state.mode, state.startedAt);
    const session: PracticeSession = {
      ...draftSession,
      finished_at: finishedAt,
      score,
      mistake_count: mistakeCount
    };

    const answerRecordStore = useAnswerRecordStore.getState();
    let recordId = nextId(answerRecordStore.rows);
    const records: AnswerRecord[] = state.submissions.map((submission) =>
      createSubmittedAnswerRecord({
        id: recordId++,
        sessionId: state.sessionId,
        symbolId: submission.question.symbol.id,
        userAnswer: submission.userAnswer,
        correct: submission.correct,
        latencyMs: submission.latencyMs,
        mistakeReason: submission.mistakeReason as AnswerRecord["mistake_reason"],
        createdAt: finishedAt
      })
    );

    await usePracticeSessionStore.getState().add(session);
    await answerRecordStore.addMany(records);

    // 错题重做：本次答对的字符，自动关闭其仍在错题本中的记录
    const resolvedSymbolIds = [...new Set(
      state.submissions.filter((item) => item.correct).map((item) => item.question.symbol.id)
    )];
    if (resolvedSymbolIds.length) {
      const updated = resolveMistakeRecords(
        useAnswerRecordStore.getState().rows,
        resolvedSymbolIds,
        finishedAt
      );
      const changed = updated.filter((row, i) => row !== useAnswerRecordStore.getState().rows[i]);
      await useAnswerRecordStore.getState().updateMany(changed);
    }

    const durationMs = new Date(finishedAt).getTime() - new Date(state.startedAt).getTime();
    logWrite("PracticeRunner", "COMPLETE", { sessionId: session.id, duration: durationMs });
    set({ finishedSession: session });
    return session;
  },

  reset() {
    set({ ...initialState });
  }
}));
