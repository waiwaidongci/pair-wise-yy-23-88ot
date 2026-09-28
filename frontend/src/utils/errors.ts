import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

// service / api 各自包装本地异常，禁止在单一位置吞掉
export class LocalDataError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, detail?: string) {
    super(detail ? `${ERROR_MESSAGES[code]}：${detail}` : ERROR_MESSAGES[code]);
    this.name = "LocalDataError";
    this.code = code;
  }
}

export function createServiceError(code: ErrorCode, detail?: string): LocalDataError {
  return new LocalDataError(ERROR_CODES[code] as ErrorCode, detail);
}
