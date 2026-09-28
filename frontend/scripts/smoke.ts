import "fake-indexeddb/auto";
import { strict as assert } from "node:assert";
import { ensureSeeded, exportLocalData } from "../src/api/bootstrap";
import { listBrailleSymbol } from "../src/api/BrailleSymbol";
import { listLesson } from "../src/api/Lesson";
import { createPracticeSession, persistSessionWithAnswers } from "../src/api/PracticeSession";
import { listAnswerRecord, resolveAnswerRecord } from "../src/api/AnswerRecord";
import { buildQuestions, gradeChoice, gradeDots, scoreOf } from "../src/utils/practice";
import { buildLessonStats } from "../src/utils/practiceStats";
import { selectMistakeRows } from "../src/services/mistakeService";

async function main() {
  await ensureSeeded();
  const symbols = await listBrailleSymbol();
  const lessons = await listLesson();
  assert.ok(symbols.length >= 40, `expected seeded symbols, got ${symbols.length}`);
  assert.equal(lessons.length, 4);

  const lessonOneSymbols = symbols.filter((s) => new Set(lessons[0].symbol_ids).has(s.id));
  assert.equal(lessonOneSymbols.length, 10);

  // 出题、判题
  const questions = buildQuestions(lessonOneSymbols, "MIXED", 5);
  assert.equal(questions.length, 5);
  assert.ok(questions.every((q) => q.symbol && (q.kind === "TEXT_TO_CELL" || q.options.length === 4)));

  const target = symbols[0]; // a -> "1"
  assert.equal(gradeDots([1], target).correct, true);
  assert.equal(gradeDots([], target).mistake_reason, "DOT_MISSED");
  assert.equal(gradeDots([1, 2], target).mistake_reason, "DOT_EXTRA");
  assert.equal(gradeChoice(symbols[1], target).mistake_reason, "WRONG_PICK");

  // 完整会话落库
  const session = await createPracticeSession({
    lesson_id: lessons[0].id,
    mode: "CELL_TO_TEXT",
    started_at: new Date().toISOString(),
    finished_at: "",
    score: 0,
    mistake_count: 0,
    total_count: 0
  });
  assert.ok(session.id > 0);

  const finished = {
    ...session,
    finished_at: new Date().toISOString(),
    score: scoreOf(1, 2),
    mistake_count: 1,
    total_count: 2
  };
  const { records } = await persistSessionWithAnswers(finished, [
    { session_id: session.id, symbol_id: target.id, user_answer: "a", correct: true, latency_ms: 420, mistake_reason: "", resolved: false },
    { session_id: session.id, symbol_id: symbols[1].id, user_answer: "c", correct: false, latency_ms: 1300, mistake_reason: "WRONG_PICK", resolved: false }
  ]);
  assert.equal(records.length, 2);
  assert.ok(records[0].id > 0, "answer record should get autoincrement id");
  assert.notEqual(records[0].id, records[1].id, "answer records must not collide on id 0 (constructor sentinel)");

  const stored = await listAnswerRecord();
  assert.equal(stored.length, 2);

  // 错题本筛选
  const mistakes = selectMistakeRows(stored, symbols, "ALL");
  assert.equal(mistakes.length, 1);
  assert.equal(mistakes[0].symbol?.id, symbols[1].id);
  assert.equal(selectMistakeRows(stored, symbols, "DOT_MISSED").length, 0);
  assert.equal(selectMistakeRows(stored, symbols, "WRONG_PICK").length, 1);

  // 复习答对 -> 消化错题
  const resolved = await resolveAnswerRecord(mistakes[0].record);
  assert.equal(resolved.resolved, true);
  const stored2 = await listAnswerRecord();
  assert.equal(selectMistakeRows(stored2, symbols, "ALL").length, 0);

  // 进度统计
  const sessions = (await exportLocalData()).practiceSession as Parameters<typeof buildLessonStats>[1];
  const stats = buildLessonStats(await listLesson(), sessions, stored2);
  const first = stats.find((s) => s.lesson.id === lessons[0].id)!;
  assert.equal(first.sessionCount, 1);
  assert.equal(first.totalCount, 2);
  assert.equal(first.correctCount, 1);
  assert.equal(first.accuracy, 0.5);
  assert.equal(first.lastSession?.score, 50);
  assert.equal(first.delta, null);

  console.log("SMOKE OK:", {
    symbols: symbols.length,
    lessons: lessons.length,
    records: stored2.length,
    score: finished.score
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
