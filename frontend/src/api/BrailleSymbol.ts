import { idbGetAll, idbPut } from "./db";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import { logWrite } from "../utils/logger";
import { LocalDataError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";

export async function listBrailleSymbol(): Promise<BrailleSymbol[]> {
  try {
    return await idbGetAll<BrailleSymbol>("brailleSymbol");
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}

export async function saveBrailleSymbol(payload: BrailleSymbol): Promise<BrailleSymbol> {
  try {
    await idbPut("brailleSymbol", payload);
    logWrite("BrailleSymbol", payload.id ? "UPDATE" : "CREATE", { id: payload.id, letter: payload.letter });
    return payload;
  } catch (cause) {
    throw new LocalDataError(ERROR_CODES.LOCAL_DB_UNAVAILABLE, String(cause));
  }
}
