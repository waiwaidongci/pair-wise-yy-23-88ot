/** 集中错误码：数据层（IndexedDB）、业务层（service）、控制器（store）分别包装后引用。 */
export const ERROR_CODES = {
  STORAGE_UNAVAILABLE: "STORAGE_UNAVAILABLE",
  SEED_FAILED: "SEED_FAILED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  SESSION_INVALID: "SESSION_INVALID",
  ANSWER_REJECTED: "ANSWER_REJECTED"
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
