export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  LOCAL_DB_UNAVAILABLE: "本机数据库不可用，请使用支持 IndexedDB 的浏览器",
  EMPTY_LESSON: "所选课程下没有可练习的字符",
  SESSION_NOT_FOUND: "练习会话不存在或已被清除",
  ANSWER_GRADE_FAILED: "答案判定失败，请重新作答"
} as const;
