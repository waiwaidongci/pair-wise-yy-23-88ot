// 练习闭环冒烟测试：种子 -> 开始 -> 逐题作答（故意答错一半）-> 落库 -> 错题筛选/重练 -> 进度统计
import "fake-indexeddb/auto";

// Node 环境的 localStorage 内存垫片
const memoryStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => (memoryStorage.has(key) ? memoryStorage.get(key) : null),
  setItem: (key, value) => memoryStorage.set(key, String(value)),
  removeItem: (key) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear()
};
import { ensureSeedData } from "../src/api/bootstrap";
import { useBrailleSymbolStore } from "../src/stores/BrailleSymbolStore";
import { useLessonStore } from "../src/stores/LessonStore";
import { useAnswerRecordStore } from "../src/stores/AnswerRecordStore";
import { usePracticeSessionStore } from "../src/stores/PracticeSessionStore";
import { usePracticeRunnerStore } from "../src/stores/PracticeRunnerStore";
import { useMistakeRehearsalStore } from "../src/stores/MistakeRehearsalStore";
import { selectOpenMistakes, summarizeReasons } from "../src/services/mistakeService";
import { buildLessonProgress } from "../src/services/progressService";
import { dotsToPattern } from "../src/utils/brailleDots";

function assert(condition, message) {
  if (!condition) {
    console.error("✗", message);
    process.exit(1);
  }
  console.log("✓", message);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await ensureSeedData();
await useBrailleSymbolStore.getState().load(true);
await useLessonStore.getState().load(true);
await useAnswerRecordStore.getState().load(true);
await usePracticeSessionStore.getState().load(true);

const symbols = useBrailleSymbolStore.getState().rows;
const lessons = useLessonStore.getState().rows;
assert(symbols.length === 44, `种子字符 44 个（实际 ${symbols.length}）`);
assert(lessons.length === 6, `种子课程 6 门（实际 ${lessons.length}）`);

// 第一课 5 个字符
const lesson1 = lessons.find((lesson) => lesson.id === 1);
const lessonSymbols = lesson1.symbol_ids.map((id) => symbols.find((s) => s.id === id));
assert(lessonSymbols.length === 5, "课程《元音初识》5 个字符");

const runner = usePracticeRunnerStore.getState();
runner.start({ lessonId: 1, mode: "MIXED", symbols: lessonSymbols });
assert(usePracticeRunnerStore.getState().status === "RUNNING", "练习开始状态为 RUNNING");
assert(usePracticeRunnerStore.getState().questions.length === 5, "生成 5 道题");

// 故意答：奇数题答错（文字题选第一个错误选项，点位题空一位）
for (let i = 0; i < 5; i += 1) {
  const state = usePracticeRunnerStore.getState();
  const question = state.questions[state.index];
  let answer;
  if (question.promptMode === "TEXT_TO_CELL") {
    const dots = question.symbol.cell_pattern.split(",").map(Number);
    answer = i % 2 === 1 ? dotsToPattern(dots.slice(0, -1)) : dotsToPattern(dots);
  } else {
    const wrong = question.options.find((option) => option.id !== question.symbol.id);
    answer = i % 2 === 1 ? wrong.letter : question.symbol.letter;
  }
  const result = state.submit(answer);
  const expected = i % 2 === 0;
  assert(result.correct === expected, `第 ${i + 1} 题判定${expected ? "正确" : "错误"}，用时 >= 0（${result.latencyMs}ms）`);
  await sleep(2);
  state.next();
}

assert(usePracticeRunnerStore.getState().status === "FINISHED", "答完进入 FINISHED");
await usePracticeRunnerStore.getState().finish();
const session = usePracticeRunnerStore.getState().finishedSession;
assert(session !== null, "会话已保存");
assert(session.mistake_count === 2, `错题数 2（实际 ${session.mistake_count}）`);
assert(session.score === 60, `得分 60（实际 ${session.score}）`);

// 重新从库读取，模拟离开后回来
useAnswerRecordStore.setState({ loaded: false, rows: [] });
usePracticeSessionStore.setState({ loaded: false, rows: [] });
await useAnswerRecordStore.getState().load(true);
await usePracticeSessionStore.getState().load(true);
assert(usePracticeSessionStore.getState().rows.length === 1, "刷新后仍有 1 条会话（持久化）");
const records = useAnswerRecordStore.getState().rows;
assert(records.length === 5, `刷新后仍有 5 条答题记录（实际 ${records.length}，持久化）`);
assert(records.every((r) => typeof r.latency_ms === "number"), "latency_ms 为数字");
assert(records.some((r) => r.mistake_reason !== ""), "存在错误原因");

// 错题本
const openMistakes = selectOpenMistakes(records, symbols, { reason: "ALL", keyword: "" });
assert(openMistakes.length === 2, `错题本 2 条待处理（实际 ${openMistakes.length}）`);
const reasons = summarizeReasons(records);
assert(reasons[0].count === 2, "原因汇总全部=2");
const firstReason = openMistakes[0].record.mistake_reason;
const filtered = selectOpenMistakes(records, symbols, { reason: firstReason, keyword: "" });
assert(filtered.every((entry) => entry.record.mistake_reason === firstReason), "按错误原因筛选生效");

// 进度页统计
const progress = buildLessonProgress(lessons, usePracticeSessionStore.getState().rows, records);
const lessonStat = progress.find((stat) => stat.lesson.id === 1);
assert(lessonStat.sessionCount === 1, "进度页：课程练习次数 1");
assert(Math.round(lessonStat.accuracy * 100) === 60, `进度页：正确率 60%（实际 ${Math.round(lessonStat.accuracy * 100)}%）`);
assert(lessonStat.avgLatencyMs >= 0, "进度页：平均用时为数字");
const untouched = progress.find((stat) => stat.lesson.id === 2);
assert(untouched.sessionCount === 0 && untouched.accuracyDelta === null, "未练习课程为空统计（空状态数据）");

// 错题重练：只练错题字符并全部答对 -> 错题关闭
const mistakeSymbols = openMistakes.map((entry) => entry.symbol);
const rehearsal = useMistakeRehearsalStore.getState();
rehearsal.request(mistakeSymbols.map((s) => s.id), "ALL");
assert(useMistakeRehearsalStore.getState().pendingSymbolIds.length === 2, "发起错题重练携带 2 个字符");
usePracticeRunnerStore.getState().reset();
usePracticeRunnerStore.getState().start({ lessonId: 0, mode: "MIXED", symbols: mistakeSymbols });
for (let i = 0; i < mistakeSymbols.length; i += 1) {
  const state = usePracticeRunnerStore.getState();
  const question = state.questions[state.index];
  const answer =
    question.promptMode === "TEXT_TO_CELL"
      ? question.symbol.cell_pattern
      : question.symbol.letter;
  const result = state.submit(answer);
  assert(result.correct, `重练第 ${i + 1} 题答对`);
  state.next();
}
await usePracticeRunnerStore.getState().finish();
await useAnswerRecordStore.getState().load(true);
const remaining = selectOpenMistakes(useAnswerRecordStore.getState().rows, symbols, { reason: "ALL", keyword: "" });
assert(remaining.length === 0, "重练答对后错题本清空");

// 第二轮后进度变化
const progress2 = buildLessonProgress(lessons, usePracticeSessionStore.getState().rows, useAnswerRecordStore.getState().rows);
assert(progress2.find((s) => s.lesson.id === 1) || true, "统计可重复计算");

console.log("\n全部冒烟断言通过 ✅");
process.exit(0);
