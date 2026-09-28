import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/** 业务层错误：service 包装底层异常时抛出。 */
export class ServiceError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, cause?: unknown) {
    super(ERROR_MESSAGES[code]);
    this.name = "ServiceError";
    this.code = code;
    if (cause) (this as Error & { cause?: unknown }).cause = cause;
  }
}

/** 控制器层错误：store 包装 service 异常时抛出，禁止只在全局位置吞掉异常。 */
export class StoreError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, readonly cause?: unknown) {
    super(`[store:${ERROR_CODES[code]}] ${ERROR_MESSAGES[code]}`);
    this.name = "StoreError";
    this.code = code;
  }
}

export const toServiceError = (code: ErrorCode) => (cause: unknown) =>
  cause instanceof ServiceError ? cause : new ServiceError(code, cause);
