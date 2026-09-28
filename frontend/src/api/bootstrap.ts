import { idbCount, idbPutMany, type StoreName } from "./db";
import {
  seedAnswerRecords,
  seedBrailleSymbols,
  seedLessons,
  seedPracticeSessions
} from "../mocks/seedData";

const SEED_FLAG_KEY = "braille-trainer:seeded:v1";

// 首次打开时把课程与字符灌入本机 IndexedDB；练习数据留空，由学习者产生
export async function ensureSeedData(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  if (localStorage.getItem(SEED_FLAG_KEY) === "1") return;

  const symbolCount = await idbCount("brailleSymbol");
  if (symbolCount === 0) {
    await idbPutMany("brailleSymbol", seedBrailleSymbols);
    await idbPutMany("lesson", seedLessons);
    await idbPutMany("practiceSession", seedPracticeSessions);
    await idbPutMany("answerRecord", seedAnswerRecords);
  }
  localStorage.setItem(SEED_FLAG_KEY, "1");
}

export async function reseedStore(store: StoreName): Promise<void> {
  if (store === "brailleSymbol") await idbPutMany("brailleSymbol", seedBrailleSymbols);
  if (store === "lesson") await idbPutMany("lesson", seedLessons);
}
