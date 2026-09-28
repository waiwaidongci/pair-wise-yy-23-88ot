import { getAll, put } from "./database";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import { ServiceError } from "../utils/errors";
import { logEntity } from "../utils/logger";

/** 点字字符数据访问：全部落本机 IndexedDB，不接入第三方 API。 */
export async function listBrailleSymbol(): Promise<BrailleSymbol[]> {
  try {
    const rows = await getAll<BrailleSymbol>("brailleSymbol");
    return rows.sort((a, b) => a.id - b.id);
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}

export async function saveBrailleSymbol(payload: BrailleSymbol): Promise<BrailleSymbol> {
  try {
    const saved = await put<BrailleSymbol>("brailleSymbol", payload);
    logEntity("BrailleSymbol", payload.id ? "update" : "create", {
      id: saved.id,
      letter: saved.letter,
      category: saved.category,
      cell_pattern: saved.cell_pattern,
      fields: "cell_pattern/letter/pinyin/category/difficulty"
    });
    return saved;
  } catch (cause) {
    throw cause instanceof ServiceError ? cause : new ServiceError("STORAGE_UNAVAILABLE", cause);
  }
}
